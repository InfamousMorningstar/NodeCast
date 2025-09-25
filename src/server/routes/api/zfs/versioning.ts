/**
 * ZFS Versioning API Routes
 * Provides RESTful API for ZFS snapshot-based file versioning
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createZFSVersioning } from '../../../../lib/zfs/versioning';
import { log } from '../../../../lib/logger';
import { prisma } from '../../../../lib/db';

const logger = log('api:zfs:versioning');

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
export async function createSnapshot(
  req: FastifyRequest<{ Body: CreateSnapshotRequest }>,
  res: FastifyReply,
) {
  try {
    const { reason = 'manual', description } = req.body || {};
    const userId = req.user.id;

    logger.info(`Creating ZFS snapshot for user ${userId}, reason: ${reason}`);

    const result = await zfsVersioning.createSnapshot(userId, reason, description);

    if (result.success) {
      return res.code(201).send({
        success: true,
        data: {
          snapshotName: result.data,
          message: 'Snapshot created successfully',
        },
      });
    } else {
      logger.error('Failed to create snapshot', result.error);
      return res.code(500).send({
        success: false,
        error: result.error || 'Failed to create snapshot',
      });
    }
  } catch (error: any) {
    logger.error('Error in createSnapshot', error);
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * List all snapshots
 * GET /api/zfs/snapshots
 */
export async function listSnapshots(req: FastifyRequest, res: FastifyReply) {
  try {
    logger.info('Listing ZFS snapshots');

    const result = await zfsVersioning.listSnapshots();

    if (result.success) {
      return res.send({
        success: true,
        data: result.data || [],
      });
    } else {
      logger.error('Failed to list snapshots', result.error);
      return res.code(500).send({
        success: false,
        error: result.error || 'Failed to list snapshots',
      });
    }
  } catch (error: any) {
    logger.error('Error in listSnapshots', error);
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Get file versions from snapshots
 * GET /api/zfs/files/:id/versions
 */
export async function getFileVersions(req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) {
  try {
    const fileId = req.params.id;

    // Get file info from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { User: true },
    });

    if (!file) {
      return res.code(404).send({
        success: false,
        error: 'File not found',
      });
    }

    // Check permissions
    if (file.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.code(403).send({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    logger.info(`Getting versions for file ${file.name}`);

    const versions = await zfsVersioning.getFileVersions(file.name);

    return res.send({
      success: true,
      data: {
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
        },
        versions,
      },
    });
  } catch (error: any) {
    logger.error('Error in getFileVersions', error);
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Restore a file from snapshot
 * POST /api/zfs/files/restore
 */
export async function restoreFile(req: FastifyRequest<{ Body: RestoreFileRequest }>, res: FastifyReply) {
  try {
    const { filePath, snapshotName } = req.body;
    const userId = req.user.id;

    if (!filePath || !snapshotName) {
      return res.code(400).send({
        success: false,
        error: 'filePath and snapshotName are required',
      });
    }

    logger.info(`Restoring file ${filePath} from snapshot ${snapshotName}`);

    const result = await zfsVersioning.restoreFileFromSnapshot(filePath, snapshotName, userId);

    if (result.success) {
      return res.send({
        success: true,
        message: 'File restored successfully',
      });
    } else {
      logger.error('Failed to restore file', result.error);
      return res.code(500).send({
        success: false,
        error: result.error || 'Failed to restore file',
      });
    }
  } catch (error: any) {
    logger.error('Error in restoreFile', error);
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Compare file versions
 * POST /api/zfs/files/compare
 */
export async function compareVersions(
  req: FastifyRequest<{ Body: CompareVersionsRequest }>,
  res: FastifyReply,
) {
  try {
    const { filePath, fromSnapshot, toSnapshot } = req.body;

    if (!filePath || !fromSnapshot || !toSnapshot) {
      return res.code(400).send({
        success: false,
        error: 'filePath, fromSnapshot, and toSnapshot are required',
      });
    }

    logger.info(`Comparing file ${filePath} between ${fromSnapshot} and ${toSnapshot}`);

    const result = await zfsVersioning.compareFileVersions(filePath, fromSnapshot, toSnapshot);

    if (result.success) {
      return res.send({
        success: true,
        data: result.data,
      });
    } else {
      logger.error('Failed to compare versions', result.error);
      return res.code(500).send({
        success: false,
        error: result.error || 'Failed to compare file versions',
      });
    }
  } catch (error: any) {
    logger.error('Error in compareVersions', error);
    return res.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}
