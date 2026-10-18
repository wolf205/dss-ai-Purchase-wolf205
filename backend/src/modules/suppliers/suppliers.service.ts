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
import { UpdateSupplierStatusDto } from './dto/update-supplier-status.dto';
import { CreateSupplyConditionDto } from './dto/create-supply-condition.dto';
import { UpdateSupplyConditionDto } from './dto/update-supply-condition.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { SupplyConditionsService } from './supply-conditions.service';
import { mapToSupplierResponseDto } from './helpers/supplier-mapper.helper';

// Re-exports phục vụ tương thích ngược (Backward Compatibility)
export * from './interfaces/suppliers.interface';
export * from './helpers/supplier-scoring.helper';
export * from './helpers/supplier-mapper.helper';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supplyConditionsService: SupplyConditionsService,
  ) {}

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

    // 3. Đếm tổng số bản ghi thỏa điều kiện
    const totalItems = await this.prisma.supplier.count({ where });

    // 4. Lấy danh sách kèm quan hệ cần thiết để tính OTIF 5 đơn gần nhất
    const suppliers = await this.prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
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

    const items = suppliers.map((supplier) =>
      mapToSupplierResponseDto(supplier),
    );

    const totalPages = Math.ceil(totalItems / limit) || 1;

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
   * Tạo mới nhà cung cấp tuân thủ BR-21 (Mã duy nhất, không trùng lặp Case-Insensitive)
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

    return mapToSupplierResponseDto(newSupplier);
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

    return mapToSupplierResponseDto(supplier);
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
      updateData.email = dto.email ? dto.email.trim() : null;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address ? dto.address.trim() : null;
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

    return mapToSupplierResponseDto(updatedSupplier);
  }

  /**
   * Đổi trạng thái nhà cung cấp (Active <-> Inactive) theo UC-06 Bước 6 và BR-24.
   * Ràng buộc bất biến: Chặn chuyển sang Inactive nếu NCC còn đơn mua hàng (PO)
   * ở trạng thái Approved đang chờ giao hàng (EF-4, BR-24).
   */
  async updateStatus(
    id: string | number | bigint,
    dto: UpdateSupplierStatusDto,
  ): Promise<SupplierResponseDto> {
    const supplierId = BigInt(id);
    this.logger.log(`Yêu cầu đổi trạng thái NCC ID ${id} sang: ${dto.status}`);

    // 1. Kiểm tra nhà cung cấp tồn tại
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Nhà cung cấp với ID ${id} không tồn tại.`,
      });
    }

    // 2. Nếu chuyển sang Inactive, kiểm tra đơn PO Approved đang chờ giao (EF-4, BR-24)
    if (dto.status === 'Inactive') {
      const activeApprovedPoCount = await this.prisma.purchaseOrder.count({
        where: {
          supplierId,
          status: 'Approved',
        },
      });

      if (activeApprovedPoCount > 0) {
        this.logger.warn(
          `Từ chối chuyển NCC ID ${id} sang Inactive do còn ${activeApprovedPoCount} PO Approved (EF-4, BR-24)`,
        );
        throw new ConflictException({
          code: 'ACTIVE_PO_EXISTS',
          message: `Không thể ngừng hợp tác với nhà cung cấp này do đang có ${activeApprovedPoCount} Đơn mua hàng (PO) ở trạng thái 'Approved' đang chờ giao hàng. Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy các đơn mua hàng này (UC-02) trước khi ngừng hoạt động đối tác.`,
        });
      }
    }

    // 3. Cập nhật trạng thái
    const updatedSupplier = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { status: dto.status },
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

    return mapToSupplierResponseDto(updatedSupplier);
  }

  // --- Các phương thức điều kiện cung ứng (Ủy quyền cho SupplyConditionsService) ---

  async findConditionsBySupplierId(
    id: string | number | bigint,
  ): Promise<SupplyConditionResponseDto[]> {
    return await this.supplyConditionsService.findConditionsBySupplierId(id);
  }

  async createCondition(
    supplierIdInput: string | number | bigint,
    dto: CreateSupplyConditionDto,
  ): Promise<SupplyConditionResponseDto> {
    return await this.supplyConditionsService.createCondition(
      supplierIdInput,
      dto,
    );
  }

  async updateCondition(
    id: string | number | bigint,
    dto: UpdateSupplyConditionDto,
  ): Promise<SupplyConditionResponseDto> {
    return await this.supplyConditionsService.updateCondition(id, dto);
  }
}
