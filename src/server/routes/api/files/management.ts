import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AdvancedFileManager } from '../../../../lib/files/AdvancedFileManager';
import { userMiddleware } from '../../../middleware/user';
import { prisma } from '../../../../lib/db';

export const PATH = '/api/files/management';

export default async function fileManagementRoutes(server: FastifyInstance) {
  const fileManager = new AdvancedFileManager(prisma);

  // Get file metadata with tags and smart folder information
  server.get(
    '/api/files/:id/metadata',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
          include: { tags: true },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        const metadata = await fileManager.getFileMetadata(file.name);
        return reply.code(200).send({ success: true, data: metadata });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to get file metadata' });
      }
    },
  );

  // Add tags to a file
  server.post(
    '/api/files/:id/tags',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { tags } = request.body as { tags: string[] };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        await fileManager.tagFile(file.name, tags);
        return reply.code(200).send({ success: true, message: 'Tags added successfully' });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to add tags' });
      }
    },
  );

  // Remove tag from a file
  server.delete(
    '/api/files/:id/tags/:tag',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id, tag } = request.params as { id: string; tag: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        await fileManager.removeFileTag(file.name, decodeURIComponent(tag));
        return reply.code(200).send({ success: true, message: 'Tag removed successfully' });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to remove tag' });
      }
    },
  );

  // Search files by tag
  server.get(
    '/api/files/search/tags/:tag',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { tag } = request.params as { tag: string };

        const files = await fileManager.searchFilesByTag(decodeURIComponent(tag), user.id);
        return reply.code(200).send({ success: true, data: files });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to search files by tag' });
      }
    },
  );

  // Get file organization suggestions
  server.get(
    '/api/files/organization/suggestions',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { limit = 50 } = request.query as { limit?: number };

        const suggestions = await fileManager.suggestFileOrganization(user.id, Number(limit));
        return reply.code(200).send({ success: true, data: suggestions });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to get organization suggestions' });
      }
    },
  );

  // Apply file organization suggestions
  server.post(
    '/api/files/organization/apply',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { suggestionIds } = request.body as { suggestionIds: string[] };

        const allSuggestions = await fileManager.suggestFileOrganization(user.id, 1000);
        const selectedSuggestions = allSuggestions.filter((s: any) => suggestionIds.includes(s.fileId));

        await fileManager.bulkOrganizeFiles(selectedSuggestions);

        return reply.code(200).send({
          success: true,
          message: `Organized ${selectedSuggestions.length} files`,
          data: { organized: selectedSuggestions.length },
        });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to apply organization suggestions' });
      }
    },
  );

  // Bulk tag files
  server.post(
    '/api/files/bulk/tags',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { fileIds, tags } = request.body as { fileIds: string[]; tags: string[] };

        const files = await prisma.file.findMany({
          where: { id: { in: fileIds }, userId: user.id },
        });

        const filePaths = files.map((f: any) => f.name);
        await fileManager.bulkTagFiles(filePaths, tags);

        return reply.code(200).send({
          success: true,
          message: `Tagged ${files.length} files`,
          data: { tagged: files.length, tags },
        });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to bulk tag files' });
      }
    },
  );

  // Set file extended attribute
  server.post(
    '/api/files/:id/attributes',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { name, value } = request.body as { name: string; value: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        await fileManager.setFileAttribute(file.name, name, value);
        return reply.code(200).send({ success: true, message: 'Attribute set successfully' });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to set file attribute' });
      }
    },
  );

  // Get file extended attributes
  server.get(
    '/api/files/:id/attributes',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        const attributes = await fileManager.getAllFileAttributes(file.name);
        return reply.code(200).send({ success: true, data: attributes });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to get file attributes' });
      }
    },
  );

  // Get auto-generated tags for a file
  server.get(
    '/api/files/:id/auto-tags',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        const autoTags = await fileManager.getAutoGeneratedTags(file.name, file.type);

        return reply.code(200).send({
          success: true,
          data: {
            fileId: id,
            autoTags,
            suggestions: autoTags.map((tag: any) => ({
              tag,
              confidence: 0.8,
              reason: 'Auto-detected from file properties',
            })),
          },
        });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to get auto-generated tags' });
      }
    },
  );

  // Get smart folder matches for a file
  server.get(
    '/api/files/:id/smart-folders',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const file = await prisma.file.findFirst({
          where: { id, userId: user.id },
        });

        if (!file) {
          return reply.code(404).send({ success: false, error: 'File not found' });
        }

        const smartFolders = await fileManager.evaluateSmartFolders(file.name, {
          size: Number(file.size),
          mimetype: file.type,
          mtime: file.updatedAt,
        });

        return reply.code(200).send({
          success: true,
          data: {
            fileId: id,
            smartFolders: smartFolders.map((folderId: any) => ({
              id: folderId,
              name: folderId.charAt(0).toUpperCase() + folderId.slice(1).replace('-', ' '),
              matched: true,
            })),
          },
        });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to evaluate smart folders' });
      }
    },
  );

  // Get all available tags for user
  server.get(
    '/api/files/tags',
    {
      preHandler: [userMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user;

        const tags = await prisma.tag.findMany({
          where: { userId: user.id },
          include: {
            _count: {
              select: { files: true },
            },
          },
          orderBy: {
            files: {
              _count: 'desc',
            },
          },
        });

        return reply.code(200).send({
          success: true,
          data: tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            fileCount: tag._count.files,
            createdAt: tag.createdAt,
          })),
        });
      } catch (_error) {
        return reply.code(500).send({ success: false, error: 'Failed to get tags' });
      }
    },
  );
}
