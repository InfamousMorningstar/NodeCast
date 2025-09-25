/**
 * ZFS Types and Interfaces for NodeCast
 */

export interface ZFSPool {
  name: string;
  health: 'ONLINE' | 'DEGRADED' | 'FAULTED' | 'OFFLINE' | 'UNAVAIL' | 'REMOVED';
  size: number;
  allocated: number;
  free: number;
  expandsize: number;
  fragmentation: number;
  capacity: number;
  dedupratio: number;
  readonly: boolean;
}

export interface ZFSDataset {
  name: string;
  type: 'filesystem' | 'volume' | 'snapshot' | 'bookmark';
  creation: Date;
  used: number;
  available: number;
  referenced: number;
  compressratio: number;
  mountpoint?: string;
  quota?: number;
  reservation?: number;
  recordsize: number;
  compression: 'off' | 'lz4' | 'gzip' | 'gzip-1' | 'gzip-9' | 'zstd';
  dedup: 'off' | 'on' | 'verify' | 'sha256' | 'sha512' | 'skein';
  encryption: 'off' | 'on' | 'aes-128-ccm' | 'aes-192-ccm' | 'aes-256-ccm' | 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm';
  keystatus?: 'none' | 'unavailable' | 'available';
  keyformat?: 'none' | 'raw' | 'hex' | 'passphrase';
}

export interface ZFSSnapshot {
  name: string;
  dataset: string;
  creation: Date;
  used: number;
  referenced: number;
  clones: string[];
  defer_destroy: boolean;
  userRefCount: number;
  written: number;
}

export interface FileVersion {
  id: string;
  fileId: string;
  snapshotName: string;
  timestamp: Date;
  size: number;
  checksum: string;
  userAction: 'manual' | 'auto' | 'scheduled';
  description?: string;
  metadata: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    operation: 'create' | 'modify' | 'delete' | 'restore';
  };
}

export interface FileDiff {
  fileId: string;
  fromVersion: string;
  toVersion: string;
  changes: {
    type: 'added' | 'removed' | 'modified';
    offset: number;
    length: number;
    content?: Buffer;
  }[];
  similarity: number; // 0-1, percentage of similarity
}

export interface SnapshotPolicy {
  id: string;
  name: string;
  dataset: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  enabled: boolean;
  prefix: string;
  skipEmpty: boolean;
}

export interface ZFSCommand {
  command: string;
  args: string[];
  sudo?: boolean;
}

export interface ZFSOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  command?: string;
  stderr?: string;
  stdout?: string;
  exitCode?: number;
}

export interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  compressionRatio: number;
  deduplicationRatio: number;
  datasets: number;
  snapshots: number;
  pools: ZFSPool[];
}

export interface PerformanceMetrics {
  readIOPS: number;
  writeIOPS: number;
  readThroughput: number; // bytes/second
  writeThroughput: number; // bytes/second
  l2arcHitRatio: number;
  arcHitRatio: number;
  avgLatency: {
    read: number; // milliseconds
    write: number;
    sync: number;
  };
  queueDepth: number;
}

export interface SecurityAudit {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  dataset: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  risk: 'low' | 'medium' | 'high';
}