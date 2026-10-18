import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DssConfigurationResponseDto } from './dto/dss-configuration-response.dto';
import { UpdateDssConfigurationDto } from './dto/update-dss-configuration.dto';
import { DSSConfiguration } from '@prisma/client';

export const SERVICE_LEVEL_Z_MAP: Record<number, number> = {
  0.9: 1.28,
  0.95: 1.65,
  0.98: 2.05,
  0.99: 2.33,
};

export const DEFAULT_DSS_CONFIGURATION = {
  priceWeight: 0.4,
  leadTimeWeight: 0.2,
  moqWeight: 0.15,
  historyWeight: 0.25,
  targetServiceLevel: 0.95,
  zFactor: 1.65,
  reviewPeriodDays: 7,
};

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy bản ghi Singleton cấu hình DSS (id = 1).
   * Nếu cơ sở dữ liệu chưa có cấu hình (ví dụ DB mới khởi tạo),
   * tự động nạp cấu hình mặc định ban đầu theo BR-28 / INV-CONF-05.
   */
  async getConfiguration(): Promise<DssConfigurationResponseDto> {
    let config = await this.prisma.dSSConfiguration.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      this.logger.warn(
        'Bản ghi DSSConfiguration (id=1) chưa tồn tại. Tự động khởi tạo Baseline mặc định theo BR-28...',
      );

      config = await this.prisma.dSSConfiguration.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          ...DEFAULT_DSS_CONFIGURATION,
          updatedBy: 'System',
        },
      });
    }

    return this.mapToResponseDto(config);
  }

  /**
   * Cập nhật bộ tham số cấu hình DSS Singleton (id = 1).
   * Yêu cầu vai trò STORE_MANAGER.
   * Áp dụng các quy tắc BR-25, BR-26, BR-27, BR-28.
   */
  async updateConfiguration(
    dto: UpdateDssConfigurationDto,
    username?: string,
  ): Promise<DssConfigurationResponseDto> {
    // 1. Trích xuất 4 trọng số (hỗ trợ cả cặp tên weightX và xWeight)
    const priceWeight = dto.weightPrice ?? dto.priceWeight;
    const leadTimeWeight = dto.weightLeadTime ?? dto.leadTimeWeight;
    const moqWeight = dto.weightMoq ?? dto.moqWeight;
    const historyWeight = dto.weightHistory ?? dto.historyWeight;

    if (
      priceWeight === undefined ||
      leadTimeWeight === undefined ||
      moqWeight === undefined ||
      historyWeight === undefined
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Bắt buộc cung cấp đủ cả 4 trọng số đánh giá NCC (Đơn giá, Thời gian giao, MOQ, Lịch sử).',
      });
    }

    // 2. Kiểm tra tính hợp lệ tổng trọng số = 1.0 ± 0.001 (BR-25, INV-CONF-01)
    const sumWeights = priceWeight + leadTimeWeight + moqWeight + historyWeight;
    if (Math.abs(sumWeights - 1.0) > 0.001) {
      throw new BadRequestException({
        code: 'SUM_WEIGHT_NOT_100',
        message: `Tổng 4 trọng số đánh giá Nhà cung cấp (${(sumWeights * 100).toFixed(1)}%) phải bằng chính xác 100% (1.0).`,
      });
    }

    // 3. Ánh xạ tự động tất định sang Hệ số an toàn Z (BR-26, INV-CONF-02)
    const zFactor = SERVICE_LEVEL_Z_MAP[dto.targetServiceLevel];
    if (zFactor === undefined) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'targetServiceLevel không hợp lệ. Phải thuộc tập [0.90, 0.95, 0.98, 0.99].',
      });
    }

    // 4. Lưu cập nhật bản ghi Singleton (id = 1)
    const updated = await this.prisma.dSSConfiguration.upsert({
      where: { id: 1 },
      update: {
        priceWeight,
        leadTimeWeight,
        moqWeight,
        historyWeight,
        targetServiceLevel: dto.targetServiceLevel,
        zFactor,
        reviewPeriodDays: dto.reviewPeriodDays,
        updatedBy: username || 'Store Manager',
      },
      create: {
        id: 1,
        priceWeight,
        leadTimeWeight,
        moqWeight,
        historyWeight,
        targetServiceLevel: dto.targetServiceLevel,
        zFactor,
        reviewPeriodDays: dto.reviewPeriodDays,
        updatedBy: username || 'Store Manager',
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Khôi phục bộ tham số cấu hình DSS về mặc định chuẩn mực hệ thống (BR-28, AF-1).
   * Yêu cầu vai trò STORE_MANAGER.
   */
  async resetToDefaults(
    username?: string,
  ): Promise<DssConfigurationResponseDto> {
    const updated = await this.prisma.dSSConfiguration.upsert({
      where: { id: 1 },
      update: {
        ...DEFAULT_DSS_CONFIGURATION,
        updatedBy: username || 'Store Manager',
      },
      create: {
        id: 1,
        ...DEFAULT_DSS_CONFIGURATION,
        updatedBy: username || 'Store Manager',
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Chuyển đổi bản ghi DSSConfiguration từ Prisma sang DTO chuẩn,
   * chuyển Decimal sang number và format ISO timestamp.
   */
  mapToResponseDto(config: DSSConfiguration): DssConfigurationResponseDto {
    const priceWeight = Number(config.priceWeight);
    const leadTimeWeight = Number(config.leadTimeWeight);
    const moqWeight = Number(config.moqWeight);
    const historyWeight = Number(config.historyWeight);

    return {
      id: config.id,
      priceWeight,
      leadTimeWeight,
      moqWeight,
      historyWeight,
      weightPrice: priceWeight,
      weightLeadTime: leadTimeWeight,
      weightMoq: moqWeight,
      weightHistory: historyWeight,
      targetServiceLevel: Number(config.targetServiceLevel),
      zFactor: Number(config.zFactor),
      reviewPeriodDays: config.reviewPeriodDays,
      updatedBy: config.updatedBy,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
