import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { PrismaClient } from '@/prisma/client';
import { createHash } from 'crypto';
import { log } from '../logger';

export interface SyncEvent {
  id: string;
  type: 'file_created' | 'file_updated' | 'file_deleted' | 'file_moved' | 'file_restored';
  userId: string;
  filePath: string;
  timestamp: number;
  checksum?: string;
  metadata?: Record<string, any>;
  conflictResolution?: 'server_wins' | 'client_wins' | 'merge_required';
}

export interface SyncStatus {
  connected: boolean;
  lastSync: number;
  pendingChanges: number;
  syncProgress: number;
  bandwidth: {
    upload: number;
    download: number;
    available: number;
  };
}

export interface ClientConnection {
  id: string;
  userId: string;
  ws: WebSocket;
  lastSeen: number;
  subscriptions: Set<string>;
  bandwidth: BandwidthTracker;
}

class BandwidthTracker {
  private samples: Array<{ timestamp: number; bytes: number }> = [];
  private readonly maxSamples = 10;

  addSample(bytes: number): void {
    const now = Date.now();
    this.samples.push({ timestamp: now, bytes });

    // Remove old samples (older than 10 seconds)
    this.samples = this.samples.filter((s) => now - s.timestamp < 10000);

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  getBandwidth(): number {
    if (this.samples.length < 2) return 0;

    const latest = this.samples[this.samples.length - 1];
    const earliest = this.samples[0];
    const timeDiff = (latest.timestamp - earliest.timestamp) / 1000;
    const bytesDiff = this.samples.reduce((sum, s) => sum + s.bytes, 0);

    return timeDiff > 0 ? bytesDiff / timeDiff : 0;
  }

  getAvailableBandwidth(): number {
    const current = this.getBandwidth();
    // Estimate available bandwidth (this could be enhanced with network probing)
    return Math.max(0, 10 * 1024 * 1024 - current); // Assume 10MB/s max
  }
}

export class SyncEngine extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private prisma: PrismaClient;
  private syncQueue: Map<string, SyncEvent[]> = new Map();
  private conflictResolver: ConflictResolver;
  private readonly logger = log('SyncEngine');

  constructor(prisma: PrismaClient, port: number = 8081) {
    super();
    this.prisma = prisma;
    this.conflictResolver = new ConflictResolver(prisma);

    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();

    this.logger.info(`Sync engine started on port ${port}`);

    // Cleanup stale connections every 30 seconds
    setInterval(() => this.cleanupStaleConnections(), 30000);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleNewConnection(ws, request);
    });
  }

  private async handleNewConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const clientId = this.generateClientId();
    const client: ClientConnection = {
      id: clientId,
      userId: '', // Will be set during authentication
      ws,
      lastSeen: Date.now(),
      subscriptions: new Set(),
      bandwidth: new BandwidthTracker(),
    };

    this.clients.set(clientId, client);

    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('pong', () => {
      if (this.clients.has(clientId)) {
        this.clients.get(clientId)!.lastSeen = Date.now();
      }
    });

    // Send initial handshake
    this.sendMessage(clientId, {
      type: 'handshake',
      clientId,
      serverTime: Date.now(),
    });

    this.logger.info(`New sync client connected: ${clientId}`);
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());
      client.bandwidth.addSample(data.length);
      client.lastSeen = Date.now();

      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(clientId, message);
          break;
        case 'subscribe':
          await this.handleSubscription(clientId, message);
          break;
        case 'sync_event':
          await this.handleSyncEvent(clientId, message);
          break;
        case 'request_sync':
          await this.handleSyncRequest(clientId, message);
          break;
        case 'heartbeat':
          this.sendMessage(clientId, { type: 'heartbeat_ack' });
          break;
        default:
          this.logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message from ${clientId}:`, { error: String(error) });
      this.sendError(clientId, 'Invalid message format');
    }
  }

  private async handleAuthentication(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Validate token (simplified - should use proper JWT validation)
      const user = await this.prisma.user.findUnique({
        where: { token: message.token },
      });

      if (!user) {
        this.sendError(clientId, 'Invalid authentication token');
        client.ws.close();
        return;
      }

      client.userId = user.id;

      this.sendMessage(clientId, {
        type: 'authenticated',
        userId: user.id,
        serverTime: Date.now(),
      });

      this.logger.info(`Client ${clientId} authenticated as user ${user.id}`);
    } catch (error) {
      this.logger.error(`Authentication error for ${clientId}:`, { error: String(error) });
      this.sendError(clientId, 'Authentication failed');
    }
  }

  private async handleSubscription(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    const { folders = [] } = message;

    // Clear existing subscriptions
    client.subscriptions.clear();

    // Add new subscriptions
    folders.forEach((folder: string) => {
      client.subscriptions.add(folder);
    });

    this.sendMessage(clientId, {
      type: 'subscription_confirmed',
      folders: Array.from(client.subscriptions),
    });

    this.logger.info(`Client ${clientId} subscribed to ${folders.length} folders`);
  }

  private async handleSyncEvent(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    const syncEvent: SyncEvent = {
      ...message.event,
      userId: client.userId,
      timestamp: Date.now(),
    };

    // Check for conflicts
    const conflict = await this.conflictResolver.checkForConflicts(syncEvent);
    if (conflict) {
      syncEvent.conflictResolution = await this.conflictResolver.resolveConflict(conflict);
    }

    // Add to sync queue
    if (!this.syncQueue.has(client.userId)) {
      this.syncQueue.set(client.userId, []);
    }
    this.syncQueue.get(client.userId)!.push(syncEvent);

    // Broadcast to other clients
    await this.broadcastSyncEvent(syncEvent, clientId);

    this.sendMessage(clientId, {
      type: 'sync_event_ack',
      eventId: syncEvent.id,
      conflictResolution: syncEvent.conflictResolution,
    });
  }

  private async handleSyncRequest(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    const { lastSync, folders } = message;
    const events = await this.getSyncEvents(client.userId, lastSync, folders);

    // Apply bandwidth-aware batching
    const batches = this.createBandwidthAwareBatches(events, client.bandwidth);

    for (const batch of batches) {
      this.sendMessage(clientId, {
        type: 'sync_batch',
        events: batch,
        hasMore: batches.indexOf(batch) < batches.length - 1,
      });

      // Small delay between batches to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async broadcastSyncEvent(event: SyncEvent, excludeClientId: string): Promise<void> {
    const relevantClients = Array.from(this.clients.values()).filter(
      (client) =>
        client.userId !== event.userId &&
        client.id !== excludeClientId &&
        this.isEventRelevantForClient(event, client),
    );

    for (const client of relevantClients) {
      this.sendMessage(client.id, {
        type: 'sync_event',
        event,
      });
    }
  }

  private isEventRelevantForClient(event: SyncEvent, client: ClientConnection): boolean {
    // Check if the file path matches any of the client's subscriptions
    return Array.from(client.subscriptions).some((subscription) => event.filePath.startsWith(subscription));
  }

  private async getSyncEvents(userId: string, lastSync: number, folders: string[]): Promise<SyncEvent[]> {
    // Get events from database (simplified - would need proper event storage)
    const userQueue = this.syncQueue.get(userId) || [];
    return userQueue.filter(
      (event) => event.timestamp > lastSync && folders.some((folder) => event.filePath.startsWith(folder)),
    );
  }

  private createBandwidthAwareBatches(events: SyncEvent[], bandwidth: BandwidthTracker): SyncEvent[][] {
    const batches: SyncEvent[][] = [];
    const availableBandwidth = bandwidth.getAvailableBandwidth();
    const maxBatchSize = Math.max(1, Math.floor(availableBandwidth / (1024 * 1024))); // 1MB per event estimate

    for (let i = 0; i < events.length; i += maxBatchSize) {
      batches.push(events.slice(i, i + maxBatchSize));
    }

    return batches;
  }

  private sendMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      const data = JSON.stringify(message);
      client.ws.send(data);
      client.bandwidth.addSample(Buffer.byteLength(data));
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'error',
      message: error,
      timestamp: Date.now(),
    });
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.logger.info(`Client ${clientId} (user: ${client.userId}) disconnected`);
      this.clients.delete(clientId);
    }
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastSeen > staleThreshold) {
        this.logger.info(`Cleaning up stale connection: ${clientId}`);
        client.ws.close();
        this.clients.delete(clientId);
      } else {
        // Send ping to active connections
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }
  }

  private generateClientId(): string {
    return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 16);
  }

  public getSyncStatus(userId: string): SyncStatus {
    const userClients = Array.from(this.clients.values()).filter((c) => c.userId === userId);
    const connected = userClients.length > 0;
    const pendingChanges = this.syncQueue.get(userId)?.length || 0;

    let totalUpload = 0;
    let totalDownload = 0;
    let availableBandwidth = 0;

    userClients.forEach((client) => {
      const bandwidth = client.bandwidth.getBandwidth();
      totalUpload += bandwidth;
      totalDownload += bandwidth;
      availableBandwidth += client.bandwidth.getAvailableBandwidth();
    });

    return {
      connected,
      lastSync: Math.max(...userClients.map((c) => c.lastSeen), 0),
      pendingChanges,
      syncProgress: pendingChanges > 0 ? 0 : 100,
      bandwidth: {
        upload: totalUpload,
        download: totalDownload,
        available: availableBandwidth,
      },
    };
  }

  public async broadcastToUser(userId: string, message: any): Promise<void> {
    const userClients = Array.from(this.clients.values()).filter((c) => c.userId === userId);

    for (const client of userClients) {
      this.sendMessage(client.id, message);
    }
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getUserConnections(userId: string): number {
    return Array.from(this.clients.values()).filter((c) => c.userId === userId).length;
  }

  public close(): void {
    this.logger.info('Shutting down sync engine');

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    // Close WebSocket server
    this.wss.close();

    this.clients.clear();
    this.syncQueue.clear();
  }
}

class ConflictResolver {
  private prisma: PrismaClient;
  private readonly logger = log('ConflictResolver');

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async checkForConflicts(event: SyncEvent): Promise<any | null> {
    // Check if file has been modified by another user recently
    const recentEvents = await this.getRecentEvents(event.filePath, event.timestamp - 30000);

    return recentEvents.find(
      (e) => e.userId !== event.userId && e.type === 'file_updated' && e.checksum !== event.checksum,
    );
  }

  async resolveConflict(conflict: any): Promise<'server_wins' | 'client_wins' | 'merge_required'> {
    // Simple conflict resolution strategy
    // In a real implementation, this would be more sophisticated

    const timeDiff = Math.abs(conflict.timestamp - Date.now());

    if (timeDiff < 5000) {
      // 5 seconds
      return 'merge_required';
    }

    // Server wins for now (could be configurable per user/file)
    return 'server_wins';
  }

  private async getRecentEvents(filePath: string, since: number): Promise<SyncEvent[]> {
    // This would query the database for recent sync events
    // Simplified implementation
    return [];
  }
}

export { BandwidthTracker, ConflictResolver };
