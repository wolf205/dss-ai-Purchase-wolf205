import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogItemDto } from './dto/audit-log-response.dto';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';

export interface CreateAuditLogInput {
  userId?: bigint | string | number | null;
  username: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
}

export interface AuditLogQueryResult {
  items: AuditLogItemDto[];
  pagination: PaginationMetaDto;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ghi nhận một bản ghi nhật ký hoạt động (Append-Only).
   * Không cung cấp hàm sửa/xóa nhằm bảo đảm tính bất biến lịch sử kiểm toán.
   */
  async createLog(input: CreateAuditLogInput) {
    try {
      const mergedMetadata = {
        ...(input.metadata || {}),
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      };

      const finalUserId = input.userId != null ? BigInt(input.userId) : null;
      const entityType = input.entityType || 'SYSTEM';
      const entityId = input.entityId || 'N/A';
      const description =
        input.description || `Thực hiện hành vi ${input.action}`;

      return await this.prisma.activityLog.create({
        data: {
          userId: finalUserId,
          username: input.username,
          action: input.action,
          entityType,
          entityId,
          description,
          metadata:
            Object.keys(mergedMetadata).length > 0
              ? (mergedMetadata as Prisma.InputJsonValue)
              : Prisma.DbNull,
        },
      });
    } catch (error) {
      this.logger.error(
        `Thất bại khi lưu nhật ký kiểm toán [${input.action}] cho user [${input.username}]:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Tra cứu danh sách nhật ký kiểm toán có phân trang và bộ lọc linh hoạt.
   */
  async findAll(query: QueryAuditLogDto): Promise<AuditLogQueryResult> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};

    if (query.action && query.action.trim() !== '') {
      where.action = { contains: query.action.trim(), mode: 'insensitive' };
    }

    if (query.username && query.username.trim() !== '') {
      where.username = { contains: query.username.trim(), mode: 'insensitive' };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate);
      }
    }

    const [totalItems, logs] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const items: AuditLogItemDto[] = logs.map((log) => {
      const metaObj =
        log.metadata &&
        typeof log.metadata === 'object' &&
        !Array.isArray(log.metadata)
          ? (log.metadata as Record<string, unknown>)
          : null;

      const ipAddress =
        metaObj && typeof metaObj['ipAddress'] === 'string'
          ? (metaObj['ipAddress'] as string)
          : metaObj && typeof metaObj['ip'] === 'string'
            ? (metaObj['ip'] as string)
            : null;

      return {
        id: log.id.toString(),
        userId: log.userId != null ? log.userId.toString() : null,
        username: log.username,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        metadata: metaObj,
        ipAddress,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }
}
