import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SyncEngine, SyncStatus } from '../../../lib/sync/SyncEngine';
import { userMiddleware } from '../../middleware/user';
import { prisma } from '../../../lib/db';

export const PATH = '/api/sync';

export default async function syncRoutes(server: FastifyInstance) {
  const syncEngine = new SyncEngine(prisma, 8081);

  // Get sync status for current user
  server.get(
    '/api/sync/status',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const status: SyncStatus = syncEngine.getSyncStatus(user.id);

        return reply.code(200).send({
          success: true,
          data: status,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get sync status',
        });
      }
    },
  );

  // Get connected clients count
  server.get(
    '/api/sync/clients',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const totalClients = syncEngine.getConnectedClients();
        const userConnections = syncEngine.getUserConnections(user.id);

        return reply.code(200).send({
          success: true,
          data: {
            totalClients,
            userConnections,
            isConnected: userConnections > 0,
          },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get client information',
        });
      }
    },
  );

  // Broadcast message to user's connected clients
  server.post(
    '/api/sync/broadcast',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { message, type = 'notification' } = request.body as {
          message: any;
          type?: string;
        };

        await syncEngine.broadcastToUser(user.id, {
          type,
          data: message,
          timestamp: Date.now(),
        });

        return reply.code(200).send({
          success: true,
          message: 'Message broadcasted successfully',
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to broadcast message',
        });
      }
    },
  );

  // WebSocket connection info
  server.get(
    '/api/sync/connection-info',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const wsUrl = 'ws://localhost:8081';
        const user = (request as any).user;

        return reply.code(200).send({
          success: true,
          data: {
            wsUrl,
            userId: user.id,
            token: user.token,
            protocols: ['sync-v1'],
          },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get connection info',
        });
      }
    },
  );

  // Force sync for specific folder
  server.post(
    '/api/sync/force',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { folder, recursive = true } = request.body as {
          folder: string;
          recursive?: boolean;
        };

        // Broadcast force sync event to user's clients
        await syncEngine.broadcastToUser(user.id, {
          type: 'force_sync',
          data: {
            folder,
            recursive,
            timestamp: Date.now(),
          },
        });

        return reply.code(200).send({
          success: true,
          message: 'Force sync initiated',
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to initiate force sync',
        });
      }
    },
  );

  // Get sync statistics
  server.get(
    '/api/sync/stats',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const status = syncEngine.getSyncStatus(user.id);

        // Get file sync history from database (simplified)
        const recentFiles = await prisma.file.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            originalName: true,
            updatedAt: true,
            size: true,
          },
        });

        return reply.code(200).send({
          success: true,
          data: {
            ...status,
            recentFiles: recentFiles.map((file: any) => ({
              id: file.id,
              name: file.originalName,
              lastModified: file.updatedAt,
              size: Number(file.size),
            })),
            syncStats: {
              totalFiles: await prisma.file.count({ where: { userId: user.id } }),
              totalSize: await prisma.file
                .aggregate({
                  where: { userId: user.id },
                  _sum: { size: true },
                })
                .then((result: any) => Number(result._sum.size) || 0),
            },
          },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get sync statistics',
        });
      }
    },
  );

  // Cleanup on server shutdown
  server.addHook('onClose', async () => {
    syncEngine.close();
  });
}
