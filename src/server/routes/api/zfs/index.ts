/**
 * ZFS API Routes Registration
 */

import { FastifyInstance } from 'fastify';
import { userMiddleware } from '../../../middleware/user';
import {
  createSnapshot,
  listSnapshots,
  getFileVersions,
  restoreFile,
  compareVersions,
} from '../../../../lib/zfs/routes';

export const PATH = '/api/zfs';

export default async function zfsRoutes(fastify: FastifyInstance) {
  // Snapshot management
  fastify.post('/snapshots', { preHandler: [userMiddleware] }, createSnapshot);
  fastify.get('/snapshots', { preHandler: [userMiddleware] }, listSnapshots);

  // File versioning
  fastify.get('/files/:id/versions', { preHandler: [userMiddleware] }, getFileVersions);
  fastify.post('/files/restore', { preHandler: [userMiddleware] }, restoreFile);
  fastify.post('/files/compare', { preHandler: [userMiddleware] }, compareVersions);
}
