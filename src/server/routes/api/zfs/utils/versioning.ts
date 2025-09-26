/**
 * ZFS Versioning API Routes
 * Provides RESTful API for ZFS snapshot-based file versioning
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createZFSVersioning } from '../../../../../lib/zfs/versioning';
import { log } from '../../../../../lib/logger';
import { prisma } from '../../../../../lib/db';

const logger = log('api:zfs:versioning');

export const PATH = '/api/zfs/utils/versioning';

// Create ZFS versioning instance
const zfsVersioning = createZFSVersioning(
  process.env.ZFS_DATASET_PATH || 'pool/nodecast/uploads',
  process.env.DATASOURCE_LOCAL_DIRECTORY || '/nodecast/uploads',
);

export interface CreateSnapshotRequest {
  reason?: 'manual' | 'auto' | 'scheduled';
  description?: string;
}

export interface RestoreFileRequest {
  filePath: string;
  snapshotName: string;
}

export interface CompareVersionsRequest {
  filePath: string;
  fromSnapshot: string;
  toSnapshot: string;
}

/**
 * Create a ZFS snapshot
 * POST /api/zfs/snapshots
 */
export async function createSnapshot(req: FastifyRequest, res: FastifyReply) {
  try {
    const { reason = 'manual', description } = (req.body as CreateSnapshotRequest) || {};
    const userId = (req as any).user.id;

    logger.info(`Creating ZFS snapshot for user ${userId}, reason: ${reason}`);

    const result = await zfsVersioning.createSnapshot(userId, reason, description);

    if (!result.success) {
      logger.error('Failed to create snapshot', { error: result.error });
      return res.code(500).send({
        success: false,
        error: 'Failed to create snapshot',
      });
    }

    // Store snapshot info in database
    const dbSnapshot = await prisma.zfsSnapshot.create({
      data: {
        name: (result.data as any).name,
        dataset: process.env.ZFS_DATASET_PATH || 'pool/nodecast/uploads',
        userId,
        reason: reason || 'manual',
        description,
        size: 0, // Will be updated later by background job
      },
    });

    return res.code(201).send({
      success: true,
      data: dbSnapshot,
    });
  } catch (error) {
    logger.error('Error creating snapshot:', { error: String(error) });
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * List all ZFS snapshots
 * GET /api/zfs/snapshots
 */
export async function listSnapshots(req: FastifyRequest, res: FastifyReply) {
  try {
    const userId = (req as any).user.id;

    logger.info(`Listing ZFS snapshots for user ${userId}`);

    const result = await zfsVersioning.listSnapshots();

    if (!result.success) {
      logger.error('Failed to list snapshots', { error: result.error });
      return res.code(500).send({
        success: false,
        error: 'Failed to list snapshots',
      });
    }

    // Get additional metadata from database
    const snapshotNames = result.data!.map((s: any) => s.name);
    const dbSnapshots = await prisma.zfsSnapshot.findMany({
      where: {
        name: { in: snapshotNames },
        userId,
      },
    });

    // Merge ZFS data with database metadata
    const enrichedSnapshots = result.data!.map((snapshot: any) => {
      const dbData = dbSnapshots.find((db) => db.name === snapshot.name);
      return {
        ...snapshot,
        id: dbData?.id,
        reason: dbData?.reason || 'unknown',
        description: dbData?.description,
        isAutomatic: dbData?.reason === 'auto' || dbData?.reason === 'scheduled' || false,
      };
    });

    return res.code(200).send({
      success: true,
      data: enrichedSnapshots,
    });
  } catch (error) {
    logger.error('Error listing snapshots:', { error: String(error) });
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Get file versions from ZFS snapshots
 * GET /api/zfs/files/:id/versions
 */
export async function getFileVersions(req: FastifyRequest, res: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user.id;

    // Find the file in database
    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.code(404).send({
        success: false,
        error: 'File not found',
      });
    }

    logger.info(`Getting versions for file ${file.name}`);

    const result = await zfsVersioning.getFileVersions(file.name);

    return res.code(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting file versions:', { error: String(error) });
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Restore file from ZFS snapshot
 * POST /api/zfs/files/restore
 */
export async function restoreFile(req: FastifyRequest, res: FastifyReply) {
  try {
    const { filePath, snapshotName } = req.body as RestoreFileRequest;
    const userId = (req as any).user.id;

    // Verify user owns the file
    const file = await prisma.file.findFirst({
      where: { name: filePath, userId },
    });

    if (!file) {
      return res.code(404).send({
        success: false,
        error: 'File not found or access denied',
      });
    }

    logger.info(`Restoring file ${filePath} from snapshot ${snapshotName}`);

    const result = await zfsVersioning.restoreFileFromSnapshot(filePath, snapshotName, userId);

    if (!result.success) {
      logger.error('Failed to restore file', { error: result.error });
      return res.code(500).send({
        success: false,
        error: 'Failed to restore file',
      });
    }

    return res.code(200).send({
      success: true,
      message: 'File restored successfully',
    });
  } catch (error) {
    logger.error('Error restoring file:', { error: String(error) });
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Compare file versions between snapshots
 * POST /api/zfs/files/compare
 */
export async function compareVersions(req: FastifyRequest, res: FastifyReply) {
  try {
    const { filePath, fromSnapshot, toSnapshot } = req.body as CompareVersionsRequest;
    const userId = (req as any).user.id;

    // Verify user owns the file
    const file = await prisma.file.findFirst({
      where: { name: filePath, userId },
    });

    if (!file) {
      return res.code(404).send({
        success: false,
        error: 'File not found or access denied',
      });
    }

    logger.info(`Comparing versions of ${filePath}: ${fromSnapshot} -> ${toSnapshot}`);

    const result = await zfsVersioning.compareFileVersions(filePath, fromSnapshot, toSnapshot);

    if (!result.success) {
      logger.error('Failed to compare versions', { error: result.error });
      return res.code(500).send({
        success: false,
        error: 'Failed to compare file versions',
      });
    }

    return res.code(200).send({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Error comparing versions:', { error: String(error) });
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}
