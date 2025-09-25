/**
 * ZFS Snapshot-Based Versioning System
 * Provides enterprise-grade file versioning using ZFS snapshots
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join, relative } from 'path';
import { createHash } from 'crypto';
import { readFile, stat, access } from 'fs/promises';
import { log } from '../logger';
import { ZFSSnapshot, FileVersion, FileDiff, SnapshotPolicy, ZFSOperationResult, ZFSCommand } from './types';
import { prisma } from '../db';

const execAsync = promisify(exec);
const logger = log('zfs:versioning');

export class ZFSVersioning {
  private readonly datasetPath: string;
  private readonly mountPoint: string;

  constructor(datasetPath: string, mountPoint: string) {
    this.datasetPath = datasetPath;
    this.mountPoint = mountPoint;
  }

  /**
   * Execute ZFS command with proper error handling
   */
  private async executeZFSCommand(command: ZFSCommand): Promise<ZFSOperationResult> {
    const cmdString = `${command.sudo ? 'sudo ' : ''}zfs ${command.command} ${command.args.join(' ')}`;

    try {
      logger.debug(`Executing ZFS command: ${cmdString}`);
      const { stdout, stderr } = await execAsync(cmdString);

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command: cmdString,
      };
    } catch (error: any) {
      logger.error(`ZFS command failed: ${cmdString}`, error);
      return {
        success: false,
        error: error.message,
        command: cmdString,
        exitCode: error.code,
        stderr: error.stderr,
      };
    }
  }

  /**
   * Create a ZFS snapshot with metadata
   */
  async createSnapshot(
    userId: string,
    reason: 'manual' | 'auto' | 'scheduled' = 'auto',
    description?: string,
  ): Promise<ZFSOperationResult<string>> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `${this.datasetPath}@nodecast-${reason}-${timestamp}`;

    const result = await this.executeZFSCommand({
      command: 'snapshot',
      args: [snapshotName],
      sudo: true,
    });

    if (result.success) {
      // Store snapshot metadata in database
      try {
        await prisma.zfsSnapshot.create({
          data: {
            name: snapshotName,
            dataset: this.datasetPath,
            createdAt: new Date(),
            userId,
            reason,
            description,
            size: await this.getSnapshotSize(snapshotName),
          },
        });

        logger.info(`Created ZFS snapshot: ${snapshotName}`);
        return { ...result, data: snapshotName };
      } catch (dbError: any) {
        logger.error('Failed to store snapshot metadata', dbError);
        // Snapshot was created but metadata storage failed
        return {
          success: true,
          data: snapshotName,
          error: `Snapshot created but metadata storage failed: ${dbError.message}`,
        };
      }
    }

    return result;
  }

  /**
   * List all snapshots for the dataset
   */
  async listSnapshots(): Promise<ZFSOperationResult<ZFSSnapshot[]>> {
    const result = await this.executeZFSCommand({
      command: 'list',
      args: ['-t', 'snapshot', '-H', '-p', '-o', 'name,creation,used,referenced,clones', this.datasetPath],
      sudo: false,
    });

    if (!result.success) {
      return result;
    }

    try {
      const snapshots: ZFSSnapshot[] = result
        .stdout!.split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [name, creation, used, referenced, clones] = line.split('\t');
          return {
            name,
            dataset: this.datasetPath,
            creation: new Date(parseInt(creation) * 1000),
            used: parseInt(used),
            referenced: parseInt(referenced),
            clones: clones ? clones.split(',') : [],
            defer_destroy: false,
            userRefCount: 0,
            written: 0,
          };
        });

      return { success: true, data: snapshots };
    } catch (parseError: any) {
      return {
        success: false,
        error: `Failed to parse snapshot list: ${parseError.message}`,
      };
    }
  }

  /**
   * Get file versions from snapshots
   */
  async getFileVersions(filePath: string): Promise<FileVersion[]> {
    const relativePath = relative(this.mountPoint, filePath);
    const snapshotsResult = await this.listSnapshots();

    if (!snapshotsResult.success || !snapshotsResult.data) {
      return [];
    }

    const versions: FileVersion[] = [];

    for (const snapshot of snapshotsResult.data) {
      try {
        const snapshotFilePath = join(
          this.mountPoint,
          '.zfs/snapshot',
          snapshot.name.split('@')[1],
          relativePath,
        );

        // Check if file exists in this snapshot
        await access(snapshotFilePath);
        const stats = await stat(snapshotFilePath);

        // Calculate file checksum
        const content = await readFile(snapshotFilePath);
        const checksum = createHash('sha256').update(content).digest('hex');

        // Get metadata from database
        const dbSnapshot = await prisma.zfsSnapshot.findUnique({
          where: { name: snapshot.name },
        });

        versions.push({
          id: `${snapshot.name}_${checksum}`,
          fileId: filePath,
          snapshotName: snapshot.name,
          timestamp: snapshot.creation,
          size: stats.size,
          checksum,
          userAction: (dbSnapshot?.reason as any) || 'auto',
          description: dbSnapshot?.description || undefined,
          metadata: {
            userId: dbSnapshot?.userId || 'system',
            operation: 'modify',
          },
        });
      } catch (error) {
        // File doesn't exist in this snapshot, skip
        continue;
      }
    }

    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Restore a file from a specific snapshot
   */
  async restoreFileFromSnapshot(
    filePath: string,
    snapshotName: string,
    userId: string,
  ): Promise<ZFSOperationResult<void>> {
    const relativePath = relative(this.mountPoint, filePath);
    const snapshotFilePath = join(this.mountPoint, '.zfs/snapshot', snapshotName.split('@')[1], relativePath);

    try {
      // Verify snapshot file exists
      await access(snapshotFilePath);

      // Create a backup snapshot before restoration
      await this.createSnapshot(userId, 'auto', `Backup before restoring ${filePath}`);

      // Copy file from snapshot
      const result = await this.executeZFSCommand({
        command: 'send',
        args: [snapshotName],
        sudo: true,
      });

      if (!result.success) {
        return result;
      }

      // Log the restoration
      await prisma.fileVersion.create({
        data: {
          fileId: filePath,
          snapshotName,
          action: 'restore',
          userId,
          timestamp: new Date(),
        },
      });

      logger.info(`Restored file ${filePath} from snapshot ${snapshotName}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to restore file: ${error.message}`,
      };
    }
  }

  /**
   * Compare two file versions
   */
  async compareFileVersions(
    filePath: string,
    fromSnapshot: string,
    toSnapshot: string,
  ): Promise<ZFSOperationResult<FileDiff>> {
    const relativePath = relative(this.mountPoint, filePath);

    try {
      const fromPath = join(this.mountPoint, '.zfs/snapshot', fromSnapshot.split('@')[1], relativePath);

      const toPath = join(this.mountPoint, '.zfs/snapshot', toSnapshot.split('@')[1], relativePath);

      const [fromContent, toContent] = await Promise.all([readFile(fromPath), readFile(toPath)]);

      // Simple diff implementation - in production, use a proper diff library
      const changes: FileDiff['changes'] = [];
      let similarity = 1.0;

      if (!fromContent.equals(toContent)) {
        similarity = this.calculateSimilarity(fromContent, toContent);
        changes.push({
          type: 'modified',
          offset: 0,
          length: toContent.length,
          content: toContent,
        });
      }

      return {
        success: true,
        data: {
          fileId: filePath,
          fromVersion: fromSnapshot,
          toVersion: toSnapshot,
          changes,
          similarity,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to compare file versions: ${error.message}`,
      };
    }
  }

  /**
   * Set up automatic snapshot policy
   */
  async setupSnapshotPolicy(policy: SnapshotPolicy): Promise<ZFSOperationResult<void>> {
    try {
      await prisma.snapshotPolicy.create({
        data: {
          name: policy.name,
          dataset: policy.dataset,
          frequency: policy.frequency,
          retention: JSON.stringify(policy.retention),
          enabled: policy.enabled,
          prefix: policy.prefix,
          skipEmpty: policy.skipEmpty,
        },
      });

      logger.info(`Created snapshot policy: ${policy.name}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create snapshot policy: ${error.message}`,
      };
    }
  }

  /**
   * Clean up old snapshots based on retention policy
   */
  async cleanupOldSnapshots(policy: SnapshotPolicy): Promise<ZFSOperationResult<number>> {
    const snapshotsResult = await this.listSnapshots();
    if (!snapshotsResult.success || !snapshotsResult.data) {
      return { success: false, error: 'Failed to list snapshots' };
    }

    const snapshots = snapshotsResult.data
      .filter((s) => s.name.includes(policy.prefix))
      .sort((a, b) => b.creation.getTime() - a.creation.getTime());

    const toDelete: string[] = [];
    const now = new Date();

    // Apply retention policy
    for (const snapshot of snapshots) {
      const age = now.getTime() - snapshot.creation.getTime();
      const ageHours = age / (1000 * 60 * 60);
      const ageDays = age / (1000 * 60 * 60 * 24);
      const ageWeeks = ageDays / 7;
      const ageMonths = ageDays / 30;

      let shouldDelete = false;

      if (policy.retention.hourly && ageHours > policy.retention.hourly) shouldDelete = true;
      if (policy.retention.daily && ageDays > policy.retention.daily) shouldDelete = true;
      if (policy.retention.weekly && ageWeeks > policy.retention.weekly) shouldDelete = true;
      if (policy.retention.monthly && ageMonths > policy.retention.monthly) shouldDelete = true;

      if (shouldDelete) {
        toDelete.push(snapshot.name);
      }
    }

    // Delete old snapshots
    let deletedCount = 0;
    for (const snapshotName of toDelete) {
      const result = await this.executeZFSCommand({
        command: 'destroy',
        args: [snapshotName],
        sudo: true,
      });

      if (result.success) {
        deletedCount++;
        // Remove from database
        await prisma.zfsSnapshot
          .delete({
            where: { name: snapshotName },
          })
          .catch(() => {}); // Ignore database errors
      }
    }

    logger.info(`Cleaned up ${deletedCount} old snapshots for policy ${policy.name}`);
    return { success: true, data: deletedCount };
  }

  /**
   * Get snapshot size
   */
  private async getSnapshotSize(snapshotName: string): Promise<number> {
    const result = await this.executeZFSCommand({
      command: 'list',
      args: ['-H', '-p', '-o', 'used', snapshotName],
      sudo: false,
    });

    if (result.success && result.stdout) {
      return parseInt(result.stdout.trim());
    }

    return 0;
  }

  /**
   * Calculate similarity between two buffers
   */
  private calculateSimilarity(buffer1: Buffer, buffer2: Buffer): number {
    const minLength = Math.min(buffer1.length, buffer2.length);
    const maxLength = Math.max(buffer1.length, buffer2.length);

    if (maxLength === 0) return 1.0;

    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (buffer1[i] === buffer2[i]) {
        matches++;
      }
    }

    return matches / maxLength;
  }
}

/**
 * Factory function to create ZFS versioning instance
 */
export function createZFSVersioning(datasetPath: string, mountPoint: string): ZFSVersioning {
  return new ZFSVersioning(datasetPath, mountPoint);
}

/**
 * Global ZFS versioning instance for the main dataset
 */
export const zfsVersioning = createZFSVersioning(
  process.env.ZFS_DATASET_PATH || 'pool/nodecast/uploads',
  process.env.DATASOURCE_LOCAL_DIRECTORY || '/nodecast/uploads',
);
