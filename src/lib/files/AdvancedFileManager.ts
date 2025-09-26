import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@/prisma/client';
import { log } from '../logger';

const execAsync = promisify(exec);

export interface FileMetadata {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];
  xattrs: Record<string, string>;
  smartFolders: string[];
  autoTags: string[];
}

export interface SmartFolderRule {
  id: string;
  name: string;
  description: string;
  conditions: SmartFolderCondition[];
  actions: SmartFolderAction[];
  enabled: boolean;
  priority: number;
}

export interface SmartFolderCondition {
  type: 'extension' | 'mimetype' | 'size' | 'age' | 'tag' | 'content' | 'name';
  operator: 'equals' | 'contains' | 'startswith' | 'endswith' | 'greater' | 'less' | 'matches';
  value: string | number;
  caseSensitive?: boolean;
}

export interface SmartFolderAction {
  type: 'move' | 'copy' | 'tag' | 'compress' | 'encrypt' | 'notify';
  target: string;
  params?: Record<string, any>;
}

export interface FileOrganizationSuggestion {
  fileId: string;
  currentPath: string;
  suggestedPath: string;
  reason: string;
  confidence: number;
  tags: string[];
}

export class AdvancedFileManager {
  private prisma: PrismaClient;
  private readonly logger = log('AdvancedFileManager');
  private readonly smartFolders: Map<string, SmartFolderRule> = new Map();
  private organizationRules: FileOrganizationRule[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeDefaultSmartFolders();
    this.initializeOrganizationRules();
  }

  // === ZFS Extended Attributes Management ===

  async setFileAttribute(filePath: string, name: string, value: string): Promise<void> {
    try {
      // Use ZFS extended attributes
      await execAsync(`setfattr -n user.nodecast.${name} -v "${value}" "${filePath}"`);
      this.logger.info(`Set extended attribute ${name}=${value} on ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to set extended attribute on ${filePath}:`, { error: String(error) });
      throw new Error(`Failed to set file attribute: ${error}`);
    }
  }

  async getFileAttribute(filePath: string, name: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`getfattr -n user.nodecast.${name} --only-values "${filePath}"`);
      return stdout.trim() || null;
    } catch (error) {
      // Attribute doesn't exist
      return null;
    }
  }

  async getAllFileAttributes(filePath: string): Promise<Record<string, string>> {
    try {
      const { stdout } = await execAsync(`getfattr -d "${filePath}"`);
      const attributes: Record<string, string> = {};

      const lines = stdout.split('\n');
      for (const line of lines) {
        const match = line.match(/^user\.nodecast\.([^=]+)="(.*)"/);
        if (match) {
          attributes[match[1]] = match[2];
        }
      }

      return attributes;
    } catch (error) {
      return {};
    }
  }

  async removeFileAttribute(filePath: string, name: string): Promise<void> {
    try {
      await execAsync(`setfattr -x user.nodecast.${name} "${filePath}"`);
      this.logger.info(`Removed extended attribute ${name} from ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to remove extended attribute from ${filePath}:`, { error: String(error) });
      throw new Error(`Failed to remove file attribute: ${error}`);
    }
  }

  // === File Tagging System ===

  async tagFile(filePath: string, tags: string[]): Promise<void> {
    const existingTags = await this.getFileTags(filePath);
    const allTags = Array.from(new Set([...existingTags, ...tags]));

    await this.setFileAttribute(filePath, 'tags', JSON.stringify(allTags));

    // Update database
    const file = await this.prisma.file.findFirst({
      where: {
        OR: [{ name: basename(filePath) }, { originalName: basename(filePath) }],
      },
    });

    if (file) {
      for (const tagName of tags) {
        // Check if tag already exists for this user
        const existingTag = await this.prisma.tag.findFirst({
          where: {
            name: tagName,
            userId: file.userId,
          },
        });

        let tag;
        if (existingTag) {
          tag = existingTag;
        } else {
          // Create tag with a default color
          tag = await this.prisma.tag.create({
            data: {
              name: tagName,
              userId: file.userId,
              color: '#3B82F6', // Default blue color
            },
          });
        }

        // Connect the tag to the file
        await this.prisma.file.update({
          where: { id: file.id },
          data: {
            tags: {
              connect: { id: tag.id },
            },
          },
        });
      }
    }
  }

  async getFileTags(filePath: string): Promise<string[]> {
    const tagsJson = await this.getFileAttribute(filePath, 'tags');
    if (!tagsJson) return [];

    try {
      return JSON.parse(tagsJson);
    } catch {
      return [];
    }
  }

  async removeFileTag(filePath: string, tag: string): Promise<void> {
    const existingTags = await this.getFileTags(filePath);
    const updatedTags = existingTags.filter((t) => t !== tag);

    if (updatedTags.length === 0) {
      await this.removeFileAttribute(filePath, 'tags');
    } else {
      await this.setFileAttribute(filePath, 'tags', JSON.stringify(updatedTags));
    }
  }

  async searchFilesByTag(tag: string, userId: string): Promise<FileMetadata[]> {
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        tags: {
          some: { name: tag },
        },
      },
      include: {
        tags: true,
      },
    });

    const results: FileMetadata[] = [];

    for (const file of files) {
      const filePath = join(process.env.UPLOAD_DIRECTORY || 'uploads', file.name);
      const xattrs = await this.getAllFileAttributes(filePath);

      results.push({
        id: file.id,
        path: filePath,
        name: file.originalName || file.name,
        size: Number(file.size),
        mimeType: file.type,
        createdAt: file.createdAt,
        modifiedAt: file.updatedAt,
        tags: file.tags.map((t: any) => t.name),
        xattrs,
        smartFolders: await this.getFileSmartFolders(file.id),
        autoTags: await this.getAutoGeneratedTags(filePath, file.type),
      });
    }

    return results;
  }

  // === Smart Folders ===

  private initializeDefaultSmartFolders(): void {
    // Images Smart Folder
    this.smartFolders.set('images', {
      id: 'images',
      name: 'Images',
      description: 'All image files',
      conditions: [
        {
          type: 'mimetype',
          operator: 'startswith',
          value: 'image/',
        },
      ],
      actions: [
        {
          type: 'tag',
          target: 'image',
        },
      ],
      enabled: true,
      priority: 1,
    });

    // Documents Smart Folder
    this.smartFolders.set('documents', {
      id: 'documents',
      name: 'Documents',
      description: 'PDF and office documents',
      conditions: [
        {
          type: 'mimetype',
          operator: 'contains',
          value: 'pdf',
        },
        {
          type: 'mimetype',
          operator: 'contains',
          value: 'document',
        },
        {
          type: 'mimetype',
          operator: 'contains',
          value: 'spreadsheet',
        },
      ],
      actions: [
        {
          type: 'tag',
          target: 'document',
        },
      ],
      enabled: true,
      priority: 1,
    });

    // Large Files Smart Folder
    this.smartFolders.set('large-files', {
      id: 'large-files',
      name: 'Large Files',
      description: 'Files larger than 100MB',
      conditions: [
        {
          type: 'size',
          operator: 'greater',
          value: 100 * 1024 * 1024,
        },
      ],
      actions: [
        {
          type: 'tag',
          target: 'large',
        },
      ],
      enabled: true,
      priority: 2,
    });

    // Recent Files Smart Folder
    this.smartFolders.set('recent', {
      id: 'recent',
      name: 'Recent Files',
      description: 'Files modified in the last 7 days',
      conditions: [
        {
          type: 'age',
          operator: 'less',
          value: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        },
      ],
      actions: [
        {
          type: 'tag',
          target: 'recent',
        },
      ],
      enabled: true,
      priority: 3,
    });
  }

  async evaluateSmartFolders(filePath: string, fileStats: any): Promise<string[]> {
    const matchedFolders: string[] = [];

    for (const [id, rule] of this.smartFolders) {
      if (!rule.enabled) continue;

      const matches = await this.evaluateConditions(rule.conditions, filePath, fileStats);
      if (matches) {
        matchedFolders.push(id);

        // Execute actions
        for (const action of rule.actions) {
          await this.executeSmartFolderAction(action, filePath);
        }
      }
    }

    return matchedFolders;
  }

  private async evaluateConditions(
    conditions: SmartFolderCondition[],
    filePath: string,
    fileStats: any,
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, filePath, fileStats);
      if (!result) return false; // All conditions must match
    }
    return true;
  }

  private async evaluateCondition(
    condition: SmartFolderCondition,
    filePath: string,
    fileStats: any,
  ): Promise<boolean> {
    let value: any;

    switch (condition.type) {
      case 'extension':
        value = extname(filePath).toLowerCase();
        break;
      case 'mimetype':
        value = fileStats.mimetype || '';
        break;
      case 'size':
        value = fileStats.size || 0;
        break;
      case 'age':
        value = Date.now() - (fileStats.mtime?.getTime() || 0);
        break;
      case 'name':
        value = basename(filePath);
        break;
      case 'tag':
        const tags = await this.getFileTags(filePath);
        value = tags.join(',');
        break;
      case 'content':
        // Content-based matching would require indexing
        return false;
      default:
        return false;
    }

    return this.matchCondition(value, condition.operator, condition.value, condition.caseSensitive);
  }

  private matchCondition(value: any, operator: string, target: any, caseSensitive = false): boolean {
    if (typeof value === 'string' && !caseSensitive) {
      value = value.toLowerCase();
      if (typeof target === 'string') {
        target = target.toLowerCase();
      }
    }

    switch (operator) {
      case 'equals':
        return value === target;
      case 'contains':
        return String(value).includes(String(target));
      case 'startswith':
        return String(value).startsWith(String(target));
      case 'endswith':
        return String(value).endsWith(String(target));
      case 'greater':
        return Number(value) > Number(target);
      case 'less':
        return Number(value) < Number(target);
      case 'matches':
        try {
          const regex = new RegExp(String(target), caseSensitive ? '' : 'i');
          return regex.test(String(value));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private async executeSmartFolderAction(action: SmartFolderAction, filePath: string): Promise<void> {
    switch (action.type) {
      case 'tag':
        await this.tagFile(filePath, [action.target]);
        break;
      case 'move':
        // Implementation would depend on file management system
        this.logger.info(`Would move ${filePath} to ${action.target}`);
        break;
      case 'copy':
        // Implementation would depend on file management system
        this.logger.info(`Would copy ${filePath} to ${action.target}`);
        break;
      case 'compress':
        // Implementation would use ZFS compression
        this.logger.info(`Would compress ${filePath}`);
        break;
      case 'encrypt':
        // Implementation would use ZFS encryption
        this.logger.info(`Would encrypt ${filePath}`);
        break;
      case 'notify':
        // Implementation would send notifications
        this.logger.info(`Would notify about ${filePath}`);
        break;
    }
  }

  async getFileSmartFolders(fileId: string): Promise<string[]> {
    const smartFoldersJson = await this.getFileAttribute('', 'smart_folders');
    if (!smartFoldersJson) return [];

    try {
      return JSON.parse(smartFoldersJson);
    } catch {
      return [];
    }
  }

  // === Automated File Organization ===

  private initializeOrganizationRules(): void {
    this.organizationRules = [
      {
        name: 'Organize by Date',
        pattern: /^(\d{4})-(\d{2})-(\d{2})/,
        targetPath: (match, file) => `archive/${match[1]}/${match[2]}/${file.name}`,
        confidence: 0.8,
      },
      {
        name: 'Organize by Project',
        pattern: /project[_-]([a-zA-Z0-9]+)/i,
        targetPath: (match, file) => `projects/${match[1]}/${file.name}`,
        confidence: 0.7,
      },
      {
        name: 'Organize Screenshots',
        pattern: /screenshot|screen[_-]shot|capture/i,
        targetPath: (match, file) => `screenshots/${new Date().getFullYear()}/${file.name}`,
        confidence: 0.9,
      },
      {
        name: 'Organize Downloads',
        pattern: /(download|temp|tmp)/i,
        targetPath: (match, file) => `downloads/${file.name}`,
        confidence: 0.6,
      },
    ];
  }

  async suggestFileOrganization(userId: string, limit = 50): Promise<FileOrganizationSuggestion[]> {
    const files = await this.prisma.file.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const suggestions: FileOrganizationSuggestion[] = [];

    for (const file of files) {
      const currentPath = join(process.env.UPLOAD_DIRECTORY || 'uploads', file.name);

      for (const rule of this.organizationRules) {
        const match = file.originalName?.match(rule.pattern) || file.name.match(rule.pattern);
        if (match) {
          const suggestedPath = rule.targetPath(match, file);
          const autoTags = await this.getAutoGeneratedTags(currentPath, file.type);

          suggestions.push({
            fileId: file.id,
            currentPath,
            suggestedPath,
            reason: rule.name,
            confidence: rule.confidence,
            tags: autoTags,
          });
          break; // Use first matching rule
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  async getAutoGeneratedTags(filePath: string, mimeType: string): Promise<string[]> {
    const tags: string[] = [];
    const fileName = basename(filePath);
    const ext = extname(filePath).toLowerCase();

    // MIME type based tags
    if (mimeType.startsWith('image/')) {
      tags.push('image');
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) tags.push('photo');
      if (mimeType.includes('png')) tags.push('graphic');
      if (mimeType.includes('svg')) tags.push('vector');
    } else if (mimeType.startsWith('video/')) {
      tags.push('video', 'media');
    } else if (mimeType.startsWith('audio/')) {
      tags.push('audio', 'media');
    } else if (mimeType.includes('pdf')) {
      tags.push('document', 'pdf');
    }

    // File extension based tags
    const extensionTags: Record<string, string[]> = {
      '.zip': ['archive', 'compressed'],
      '.rar': ['archive', 'compressed'],
      '.7z': ['archive', 'compressed'],
      '.tar': ['archive', 'compressed'],
      '.gz': ['archive', 'compressed'],
      '.doc': ['document', 'word'],
      '.docx': ['document', 'word'],
      '.xls': ['spreadsheet', 'excel'],
      '.xlsx': ['spreadsheet', 'excel'],
      '.ppt': ['presentation', 'powerpoint'],
      '.pptx': ['presentation', 'powerpoint'],
      '.txt': ['text', 'document'],
      '.md': ['text', 'markdown', 'document'],
      '.js': ['code', 'javascript'],
      '.ts': ['code', 'typescript'],
      '.py': ['code', 'python'],
      '.java': ['code', 'java'],
      '.cpp': ['code', 'cpp'],
      '.h': ['code', 'header'],
    };

    if (extensionTags[ext]) {
      tags.push(...extensionTags[ext]);
    }

    // Filename pattern based tags
    if (/screenshot|capture/i.test(fileName)) tags.push('screenshot');
    if (/backup|bak/i.test(fileName)) tags.push('backup');
    if (/temp|tmp/i.test(fileName)) tags.push('temporary');
    if (/draft|wip/i.test(fileName)) tags.push('draft', 'work-in-progress');
    if (/final|complete|done/i.test(fileName)) tags.push('final', 'complete');
    if (/meeting|call/i.test(fileName)) tags.push('meeting');
    if (/report|summary/i.test(fileName)) tags.push('report');

    return Array.from(new Set(tags));
  }

  // === Bulk Operations ===

  async bulkTagFiles(filePaths: string[], tags: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.tagFile(filePath, tags);
    }
    this.logger.info(`Bulk tagged ${filePaths.length} files with tags: ${tags.join(', ')}`);
  }

  async bulkOrganizeFiles(suggestions: FileOrganizationSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      try {
        const targetDir = dirname(suggestion.suggestedPath);
        await fs.mkdir(targetDir, { recursive: true });
        await fs.rename(suggestion.currentPath, suggestion.suggestedPath);

        // Update tags
        if (suggestion.tags.length > 0) {
          await this.tagFile(suggestion.suggestedPath, suggestion.tags);
        }

        this.logger.info(`Moved ${suggestion.currentPath} to ${suggestion.suggestedPath}`);
      } catch (error) {
        this.logger.error(`Failed to organize file ${suggestion.currentPath}:`, { error: String(error) });
      }
    }
  }

  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const stats = await fs.stat(filePath);
      const tags = await this.getFileTags(filePath);
      const xattrs = await this.getAllFileAttributes(filePath);

      // Get MIME type (simplified)
      const ext = extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.zip': 'application/zip',
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      const autoTags = await this.getAutoGeneratedTags(filePath, mimeType);

      return {
        id: basename(filePath),
        path: filePath,
        name: basename(filePath),
        size: stats.size,
        mimeType,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        tags,
        xattrs,
        smartFolders: await this.evaluateSmartFolders(filePath, { ...stats, mimetype: mimeType }),
        autoTags,
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata for ${filePath}:`, { error: String(error) });
      return null;
    }
  }
}

interface FileOrganizationRule {
  name: string;
  pattern: RegExp;
  targetPath: (match: RegExpMatchArray, file: any) => string;
  confidence: number;
}
