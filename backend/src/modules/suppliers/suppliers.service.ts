import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';

interface SupplierWithRelations {
  id: bigint;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  committedLeadTimeDays: number;
  status: string;
  performanceScore: Prisma.Decimal | number;
  allTimePerformanceScore: Prisma.Decimal | number;
  completedOrderCount: number;
  createdAt: Date;
  updatedAt: Date;
  supplyConditions?: { id: bigint }[];
  purchaseOrders?: {
    id: bigint;
    goodsReceipt?: {
      daysLate: number;
      overallFulfillmentRate: Prisma.Decimal | number;
    } | null;
  }[];
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu danh sách nhà cung cấp (hỗ trợ phân trang, lọc trạng thái, tìm kiếm từ khóa).
   * Kèm thống kê số SKU đang phân phối và OTIF 5 đơn Completed gần nhất.
   */
  async findAll(query: QuerySupplierDto): Promise<{
    items: SupplierResponseDto[];
    pagination: PaginationMetaDto;
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};

    // 1. Lọc trạng thái (Mặc định Active theo UC-06 Step 2)
    if (query.status && query.status !== 'All') {
      where.status = query.status;
    } else if (!query.status) {
      where.status = 'Active';
    }

    // 2. Tìm kiếm từ khóa không phân biệt hoa thường
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { supplierCode: { contains: term, mode: 'insensitive' } },
        { supplierName: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    this.logger.log(
      `Tra cứu nhà cung cấp: page=${page}, limit=${limit}, search=${query.search || ''}, status=${where.status || 'All'}`,
    );

    const [rawSuppliers, totalItems] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        include: {
          supplyConditions: {
            where: { status: 'Active' },
            select: { id: true },
          },
          purchaseOrders: {
            where: { status: 'Completed' },
            include: { goodsReceipt: true },
            orderBy: { id: 'desc' },
            take: 5,
          },
        },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const items: SupplierResponseDto[] = rawSuppliers.map((supplier) =>
      this.mapToResponseDto(supplier),
    );

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

  /**
   * Tạo mới một đối tác Nhà cung cấp trong hệ thống Master Data (UC-06).
   * Tuân thủ BR-21 (Mã NCC bất biến, duy nhất toàn cục không phân biệt hoa thường),
   * và BR-24 (Khởi tạo Cold Start: performanceScore = 0.8000, 80%).
   */
  async create(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(
      `Tạo mới nhà cung cấp: ${dto.supplierCode} - ${dto.supplierName}`,
    );

    // 1. Kiểm tra tính duy nhất toàn cục của mã NCC (Case-Insensitive theo BR-21, EF-1)
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        supplierCode: {
          equals: dto.supplierCode,
          mode: 'insensitive',
        },
      },
    });

    if (existingSupplier) {
      throw new ConflictException({
        code: 'DUPLICATE_CODE',
        message: `Mã nhà cung cấp '${dto.supplierCode}' đã tồn tại trong hệ thống.`,
      });
    }

    // 2. Tạo bản ghi NCC với giá trị khởi tạo an toàn (BR-24)
    const newSupplier = await this.prisma.supplier.create({
      data: {
        supplierCode: dto.supplierCode.trim(),
        supplierName: dto.supplierName.trim(),
        contactPerson: dto.contactPerson.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        committedLeadTimeDays: dto.committedLeadTimeDays,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        status: 'Active',
        performanceScore: 0.8,
        allTimePerformanceScore: 0.8,
        completedOrderCount: 0,
      },
      include: {
        supplyConditions: {
          where: { status: 'Active' },
          select: { id: true },
        },
        purchaseOrders: {
          where: { status: 'Completed' },
          include: { goodsReceipt: true },
          orderBy: { id: 'desc' },
          take: 5,
        },
      },
    });

    return this.mapToResponseDto(newSupplier);
  }

  /**
   * Lấy chi tiết một nhà cung cấp theo ID.
   */
  async findById(id: string | number | bigint): Promise<SupplierResponseDto> {
    const supplierId = BigInt(id);

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        supplyConditions: {
          where: { status: 'Active' },
          select: { id: true },
        },
        purchaseOrders: {
          where: { status: 'Completed' },
          include: { goodsReceipt: true },
          orderBy: { id: 'desc' },
          take: 5,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Nhà cung cấp với ID ${id} không tồn tại.`,
      });
    }

    return this.mapToResponseDto(supplier);
  }

  /**
   * Cập nhật thông tin hồ sơ nhà cung cấp (tên, người liên hệ, SĐT, lead time, email, địa chỉ).
   * Tuyệt đối cấm sửa mã supplierCode (BR-21).
   */
  async update(
    id: string | number | bigint,
    dto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    const supplierId = BigInt(id);
    this.logger.log(`Cập nhật thông tin nhà cung cấp ID: ${id}`);

    // 1. Kiểm tra nhà cung cấp tồn tại
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existingSupplier) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Nhà cung cấp với ID ${id} không tồn tại.`,
      });
    }

    // 2. Phòng thủ nghiệp vụ: Tuyệt đối cấm sửa mã định danh supplierCode (BR-21)
    if (
      (dto as unknown as { supplierCode?: unknown }).supplierCode !== undefined
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Mã nhà cung cấp (supplierCode) là định danh bất biến, tuyệt đối không được phép chỉnh sửa.',
      });
    }

    // 3. Chuẩn bị dữ liệu cập nhật
    const updateData: Prisma.SupplierUpdateInput = {};

    if (dto.supplierName !== undefined) {
      updateData.supplierName = dto.supplierName.trim();
    }
    if (dto.contactPerson !== undefined) {
      updateData.contactPerson = dto.contactPerson.trim();
    }
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber.trim();
    }
    if (dto.committedLeadTimeDays !== undefined) {
      updateData.committedLeadTimeDays = dto.committedLeadTimeDays;
    }
    if (dto.email !== undefined) {
      updateData.email =
        dto.email && dto.email.trim() ? dto.email.trim() : null;
    }
    if (dto.address !== undefined) {
      updateData.address =
        dto.address && dto.address.trim() ? dto.address.trim() : null;
    }

    const updatedSupplier = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
      include: {
        supplyConditions: {
          where: { status: 'Active' },
          select: { id: true },
        },
        purchaseOrders: {
          where: { status: 'Completed' },
          include: { goodsReceipt: true },
          orderBy: { id: 'desc' },
          take: 5,
        },
      },
    });

    return this.mapToResponseDto(updatedSupplier);
  }

  /**
   * Chuyển đổi Prisma Supplier Entity sang SupplierResponseDto
   * và tính toán các chỉ số OTIF 5 đơn gần nhất + nhãn phong độ BR-24.
   */
  private mapToResponseDto(
    supplier: SupplierWithRelations,
  ): SupplierResponseDto {
    const activeSkuCount = supplier.supplyConditions
      ? supplier.supplyConditions.length
      : 0;

    const recentOrders = supplier.purchaseOrders || [];

    let recent5OrderOnTimeRate: number | null = null;
    let recent5OrderFulfillmentRate: number | null = null;

    if (recentOrders.length > 0) {
      // 1. Tỷ lệ giao đúng hạn 5 đơn gần nhất (daysLate == 0 theo BR-13)
      const onTimeOrders = recentOrders.filter(
        (po) => po.goodsReceipt && po.goodsReceipt.daysLate === 0,
      ).length;
      recent5OrderOnTimeRate = Number(
        (onTimeOrders / recentOrders.length).toFixed(4),
      );

      // 2. Tỷ lệ giao đủ hàng 5 đơn gần nhất
      const fulfillmentSum = recentOrders.reduce(
        (sum, po) => sum + Number(po.goodsReceipt?.overallFulfillmentRate || 0),
        0,
      );
      recent5OrderFulfillmentRate = Number(
        (fulfillmentSum / recentOrders.length).toFixed(4),
      );
    }

    // 3. Phân loại nhãn phong độ theo BR-24
    const completedCount = supplier.completedOrderCount;
    let performanceLabel: string;
    if (completedCount < 3) {
      performanceLabel = '[NCC Mới - Điểm khởi tạo: 80%]';
    } else if (completedCount < 5) {
      performanceLabel = `[Lịch sử: ${completedCount} đơn]`;
    } else {
      performanceLabel = '[Phong độ 5 đơn gần nhất]';
    }

    return {
      id: supplier.id.toString(),
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      phoneNumber: supplier.phoneNumber,
      email: supplier.email,
      address: supplier.address,
      committedLeadTimeDays: supplier.committedLeadTimeDays,
      status: supplier.status,
      performanceScore: Number(supplier.performanceScore),
      allTimePerformanceScore: Number(supplier.allTimePerformanceScore),
      completedOrderCount: supplier.completedOrderCount,
      activeSkuCount,
      recent5OrderOnTimeRate,
      recent5OrderFulfillmentRate,
      performanceLabel,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }
}
