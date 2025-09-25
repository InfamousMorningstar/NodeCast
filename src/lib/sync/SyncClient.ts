import { EventEmitter } from 'events';

export interface SyncClientOptions {
  wsUrl: string;
  userId: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface SyncFile {
  id: string;
  path: string;
  size: number;
  lastModified: number;
  checksum: string;
}

export interface SyncConflict {
  file: SyncFile;
  serverVersion: SyncFile;
  clientVersion: SyncFile;
  resolution: 'server_wins' | 'client_wins' | 'merge_required';
}

export class SyncClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: Required<SyncClientOptions>;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private subscriptions: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pendingEvents: any[] = [];

  constructor(options: SyncClientOptions) {
    super();

    this.options = {
      ...options,
      reconnectInterval: options.reconnectInterval || 5000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.ws = new WebSocket(this.options.wsUrl, ['sync-v1']);
      this.setupWebSocket();

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.once('connected', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });

        this.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private setupWebSocket(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'handshake':
          this.authenticate();
          break;

        case 'authenticated':
          this.connected = true;
          this.emit('connected');
          this.processPendingEvents();
          break;

        case 'sync_event':
          this.emit('sync_event', message.event);
          break;

        case 'sync_batch':
          this.emit('sync_batch', message.events, message.hasMore);
          break;

        case 'sync_event_ack':
          this.emit('sync_ack', message.eventId, message.conflictResolution);
          break;

        case 'force_sync':
          this.emit('force_sync', message.data);
          break;

        case 'notification':
          this.emit('notification', message.data);
          break;

        case 'heartbeat_ack':
          // Heartbeat acknowledged
          break;

        case 'error':
          this.emit('error', new Error(message.message));
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.emit('error', error);
    }
  }

  private authenticate(): void {
    this.send({
      type: 'authenticate',
      token: this.options.token,
      userId: this.options.userId,
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect().catch(() => {
        // Reconnection will be scheduled again by onclose handler
      });
    }, this.options.reconnectInterval);
  }

  private processPendingEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      this.send(event);
    }
  }

  public subscribe(folders: string[]): void {
    this.subscriptions = new Set(folders);

    if (this.connected) {
      this.send({
        type: 'subscribe',
        folders: Array.from(this.subscriptions),
      });
    } else {
      this.pendingEvents.push({
        type: 'subscribe',
        folders: Array.from(this.subscriptions),
      });
    }
  }

  public sendSyncEvent(event: any): void {
    const syncEvent = {
      type: 'sync_event',
      event: {
        id: this.generateEventId(),
        ...event,
        timestamp: Date.now(),
      },
    };

    if (this.connected) {
      this.send(syncEvent);
    } else {
      this.pendingEvents.push(syncEvent);
    }
  }

  public requestSync(lastSync: number, folders: string[]): void {
    const request = {
      type: 'request_sync',
      lastSync,
      folders,
    };

    if (this.connected) {
      this.send(request);
    } else {
      this.pendingEvents.push(request);
    }
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public disconnect(): void {
    this.connected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

// Conflict Resolution Utilities
export class ConflictManager {
  private conflicts: Map<string, SyncConflict> = new Map();

  public addConflict(conflict: SyncConflict): void {
    this.conflicts.set(conflict.file.id, conflict);
  }

  public getConflict(fileId: string): SyncConflict | undefined {
    return this.conflicts.get(fileId);
  }

  public resolveConflict(fileId: string, resolution: 'server_wins' | 'client_wins' | 'manual'): void {
    const conflict = this.conflicts.get(fileId);
    if (!conflict) return;

    conflict.resolution = resolution as any;
    this.conflicts.delete(fileId);
  }

  public getPendingConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values());
  }

  public clearConflicts(): void {
    this.conflicts.clear();
  }
}

// File System Utilities for Sync
export class SyncFileSystem {
  public static async getFileChecksum(file: File | ArrayBuffer): Promise<string> {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  public static async compareFiles(file1: File, file2: File): Promise<boolean> {
    if (file1.size !== file2.size) return false;

    const checksum1 = await this.getFileChecksum(file1);
    const checksum2 = await this.getFileChecksum(file2);

    return checksum1 === checksum2;
  }

  public static createSyncFile(file: File, path: string): SyncFile {
    return {
      id: `${path}-${file.lastModified}`,
      path,
      size: file.size,
      lastModified: file.lastModified,
      checksum: '', // Will be calculated asynchronously
    };
  }
}

// Bandwidth-aware sync utilities
export class BandwidthManager {
  private samples: Array<{ timestamp: number; bytes: number }> = [];
  private readonly maxSamples = 20;

  public recordTransfer(bytes: number): void {
    const now = Date.now();
    this.samples.push({ timestamp: now, bytes });

    // Remove samples older than 30 seconds
    this.samples = this.samples.filter((s) => now - s.timestamp < 30000);

    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  public getCurrentBandwidth(): number {
    if (this.samples.length < 2) return 0;

    const latest = this.samples[this.samples.length - 1];
    const earliest = this.samples[0];
    const timeDiff = (latest.timestamp - earliest.timestamp) / 1000;
    const bytesDiff = this.samples.reduce((sum, s) => sum + s.bytes, 0);

    return timeDiff > 0 ? bytesDiff / timeDiff : 0;
  }

  public getOptimalChunkSize(): number {
    const bandwidth = this.getCurrentBandwidth();

    // Adjust chunk size based on bandwidth (min 64KB, max 4MB)
    const minChunk = 64 * 1024;
    const maxChunk = 4 * 1024 * 1024;

    if (bandwidth < 100 * 1024) return minChunk; // < 100KB/s
    if (bandwidth < 1024 * 1024) return 256 * 1024; // < 1MB/s
    return maxChunk; // >= 1MB/s
  }
}
