import React, { useState, useEffect, useCallback } from 'react';
import { SyncClient, SyncStatus, ConflictManager } from '../../lib/sync';

interface SyncStatusComponentProps {
  userId: string;
  token: string;
  wsUrl?: string;
  folders?: string[];
  onSyncEvent?: (event: any) => void;
  onError?: (error: Error) => void;
}

export function SyncStatusComponent({
  userId,
  token,
  wsUrl = 'ws://localhost:8081',
  folders = ['/'],
  onSyncEvent,
  onError
}: SyncStatusComponentProps) {
  const [syncClient, setSyncClient] = useState<SyncClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Partial<SyncStatus>>({
    connected: false,
    lastSync: 0,
    pendingChanges: 0,
    syncProgress: 0,
    bandwidth: {
      upload: 0,
      download: 0,
      available: 0
    }
  });
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const conflictManager = new ConflictManager();

  // Initialize sync client
  useEffect(() => {
    const client = new SyncClient({
      wsUrl,
      userId,
      token,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    });

    // Event handlers
    client.on('connected', () => {
      setIsConnected(true);
      setReconnectAttempt(0);
      client.subscribe(folders);
      fetchSyncStatus();
    });

    client.on('disconnected', () => {
      setIsConnected(false);
    });

    client.on('reconnecting', (attempt: number) => {
      setReconnectAttempt(attempt);
    });

    client.on('sync_event', (event: any) => {
      onSyncEvent?.(event);
      
      if (event.conflictResolution === 'merge_required') {
        conflictManager.addConflict({
          file: event,
          serverVersion: event,
          clientVersion: event,
          resolution: event.conflictResolution
        });
        setConflicts(conflictManager.getPendingConflicts());
      }
    });

    client.on('sync_batch', (events: any[], hasMore: boolean) => {
      events.forEach(event => onSyncEvent?.(event));
    });

    client.on('force_sync', (data: any) => {
      console.log('Force sync requested:', data);
      // Trigger local sync for the specified folder
    });

    client.on('error', (error: Error) => {
      onError?.(error);
      console.error('Sync error:', error);
    });

    setSyncClient(client);

    // Connect
    client.connect().catch((err: any) => onError?.(err));

    return () => {
      client.disconnect();
    };
  }, [userId, token, wsUrl]);

  // Fetch sync status from API
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, [token]);

  // Poll sync status every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatBandwidth = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const getConnectionStatus = (): string => {
    if (isConnected) return 'Connected';
    if (reconnectAttempt > 0) return `Reconnecting (${reconnectAttempt}/10)`;
    return 'Disconnected';
  };

  const getStatusColor = (): string => {
    if (isConnected) return 'text-green-500';
    if (reconnectAttempt > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const resolveConflict = (fileId: string, resolution: 'server_wins' | 'client_wins') => {
    conflictManager.resolveConflict(fileId, resolution);
    setConflicts(conflictManager.getPendingConflicts());
  };

  const forceSync = async (folder: string) => {
    try {
      await fetch('/api/sync/force', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ folder, recursive: true })
      });
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sync Status</h3>
        <div className={`flex items-center ${getStatusColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
          <span className="text-sm font-medium">{getConnectionStatus()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Last Sync</div>
          <div className="text-lg font-medium">
            {syncStatus.lastSync ? 
              new Date(syncStatus.lastSync).toLocaleString() : 
              'Never'
            }
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending Changes</div>
          <div className="text-lg font-medium">{syncStatus.pendingChanges || 0}</div>
        </div>
      </div>

      {syncStatus.bandwidth && (
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">Bandwidth</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Up:</span>{' '}
              <span className="font-medium">
                {formatBandwidth(syncStatus.bandwidth.upload)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Down:</span>{' '}
              <span className="font-medium">
                {formatBandwidth(syncStatus.bandwidth.download)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Available:</span>{' '}
              <span className="font-medium">
                {formatBandwidth(syncStatus.bandwidth.available)}
              </span>
            </div>
          </div>
        </div>
      )}

      {syncStatus.syncProgress !== undefined && syncStatus.syncProgress < 100 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Sync Progress</span>
            <span className="font-medium">{syncStatus.syncProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncStatus.syncProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-yellow-600 mb-2">
            {conflicts.length} conflicts need resolution
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="text-sm font-medium mb-1">{conflict.file.path}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveConflict(conflict.file.id, 'server_wins')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Use Server Version
                  </button>
                  <button
                    onClick={() => resolveConflict(conflict.file.id, 'client_wins')}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Use Local Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => forceSync('/')}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          Force Sync
        </button>
        
        {isConnected && (
          <button
            onClick={() => syncClient?.requestSync(syncStatus.lastSync || 0, folders)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Request Updates
          </button>
        )}
      </div>
    </div>
  );
}

export default SyncStatusComponent;