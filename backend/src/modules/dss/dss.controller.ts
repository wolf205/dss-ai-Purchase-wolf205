import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DssSessionAnalysisService } from './services/dss-session-analysis.service';
import { DssSessionQueryService } from './services/dss-session-query.service';
import { DssItemAdjustmentService } from './services/dss-item-adjustment.service';
import { DssExplainabilityService } from './services/dss-explainability.service';
import { DssApprovalService } from './services/dss-approval.service';
import { DssEvaluationService } from './services/dss-evaluation.service';
import { AnalyzeSessionRequestDto } from './dto/analyze-session.dto';
import { AnalyzeSessionResponseDto } from './dto/analyze-session-response.dto';
import {
  DssSessionDetailResponseDto,
  RecommendationItemDetailDto,
} from './dto/dss-session-detail-response.dto';
import { UpdateRecommendationItemDto } from './dto/update-recommendation-item.dto';
import { ExplainRecommendationItemResponseDto } from './dto/explain-item-response.dto';
import { ApproveSessionResponseDto } from './dto/approve-session-response.dto';
import {
  DssSessionEvaluationResponseDto,
  DssSessionSummaryItemDto,
} from './dto/dss-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('DSS')
@Controller('dss')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DssController {
  constructor(
    private readonly sessionAnalysisService: DssSessionAnalysisService,
    private readonly sessionQueryService: DssSessionQueryService,
    private readonly itemAdjustmentService: DssItemAdjustmentService,
    private readonly explainabilityService: DssExplainabilityService,
    private readonly approvalService: DssApprovalService,
    private readonly evaluationService: DssEvaluationService,
  ) {}

  @Post('sessions/analyze')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @AuditLog({
    action: 'DSS_ANALYZE_SESSION',
    entityType: 'RecommendationSession',
    description:
      'Kích hoạt chuỗi phân tích DSS và khởi tạo phiên đề xuất mua hàng',
  })
  @ApiOperation({
    summary: 'Khởi tạo phiên phân tích mua hàng DSS (Trigger Analyze Session)',
    description:
      'Kích hoạt chuỗi phân tích DSS: Lọc danh mục SKU theo phạm vi -> Dự báo nhu cầu 14 ngày tới (kèm Graceful Fallback SMA) -> Chạy thuật toán tất định 5A (ABC-XYZ, SS, ROP, SOQ, WSM) -> Tự động chuyển phiên nháp cũ sang Discarded (INV-REC-03) -> Lưu phiên mới ở trạng thái Draft.',
  })
  @ApiResponse({
    status: 201,
    description: 'Khởi tạo phiên phân tích DSS thành công',
    type: AnalyzeSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Không có SKU Active hoặc dữ liệu không hợp lệ (NO_ACTIVE_PRODUCTS)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ngành hàng chỉ định (RESOURCE_NOT_FOUND)',
  })
  async analyze(
    @Body() dto: AnalyzeSessionRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnalyzeSessionResponseDto> {
    return await this.sessionAnalysisService.analyzeSession(
      dto,
      user?.username || 'system',
    );
  }

  @Get('sessions/active/draft')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary:
      'Lấy phiên đề xuất DSS trạng thái Draft gần nhất (Get Active Draft Session)',
    description:
      'Trả về thông tin chi tiết của phiên đề xuất Draft đang hoạt động gần nhất (nếu có), hoặc null nếu chưa có phiên Draft nào.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy phiên phân tích Draft thành công hoặc null',
    type: DssSessionDetailResponseDto,
  })
  async getActiveDraftSession(): Promise<DssSessionDetailResponseDto | null> {
    return await this.sessionQueryService.getActiveDraftSession();
  }

  @Get('sessions')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary:
      'Lấy danh sách các phiên đề xuất DSS (Get All Recommendation Sessions)',
    description:
      'Trả về danh sách các phiên DSS gần nhất phục vụ tra cứu lịch sử và đối soát đánh giá.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách các phiên đề xuất DSS thành công',
    type: [DssSessionSummaryItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  async getAllSessions(): Promise<DssSessionSummaryItemDto[]> {
    return await this.sessionQueryService.getAllSessions();
  }

  @Get('sessions/:id')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary:
      'Lấy chi tiết phiên phân tích và bảng đề xuất DSS (Get Session Details)',
    description:
      'Trả về thông tin chi tiết của phiên phân tích kèm danh sách các mặt hàng đề xuất (kèm snapshot tồn kho, đơn đang về, phân loại ABC-XYZ, gợi ý NCC WSM, dự báo 14 ngày và giải thích LLM).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết phiên phân tích DSS thành công',
    type: DssSessionDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phiên phân tích (RESOURCE_NOT_FOUND)',
  })
  async getSessionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DssSessionDetailResponseDto> {
    return await this.sessionQueryService.getSessionById(id);
  }

  @Patch('items/:itemId')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @AuditLog({
    action: 'DSS_UPDATE_ITEM',
    entityType: 'RecommendationItem',
    description: 'Điều chỉnh số lượng hoặc nhà cung cấp đề xuất mua hàng',
  })
  @ApiOperation({
    summary:
      'Điều chỉnh số lượng hoặc nhà cung cấp đề xuất mua hàng (Human Adjustment)',
    description:
      'Cho phép người dùng can thiệp điều chỉnh approvedQuantity và approvedSupplierId của mặt hàng trong phiên Draft, tự động đánh dấu isOverridden = true và cập nhật lại totalApprovedAmount của phiên.',
  })
  @ApiResponse({
    status: 200,
    description: 'Điều chỉnh mặt hàng thành công',
    type: RecommendationItemDetailDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu không hợp lệ hoặc phiên không ở trạng thái Draft (VALIDATION_ERROR, SESSION_NOT_IN_DRAFT, INVALID_SUPPLIER)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy mặt hàng đề xuất (RESOURCE_NOT_FOUND)',
  })
  async updateItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateRecommendationItemDto,
  ): Promise<RecommendationItemDetailDto> {
    return await this.itemAdjustmentService.updateItem(itemId, dto);
  }

  @Post('items/:itemId/explain')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary:
      'Yêu cầu giải thích lý do mua hàng tự nhiên On-demand (Google Gemini Flash)',
    description:
      'Sinh đoạn tóm tắt giải thích tự nhiên lý do vì sao nên mua SKU này dựa trên ngữ cảnh tồn kho và nhà cung cấp. Kiểm tra cache DB trước, nếu chưa có thì gọi Gemini 1.5 Flash (timeout 3s, kèm fallback tất định) và lưu cache.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tạo hoặc lấy giải thích lý do mua hàng thành công',
    type: ExplainRecommendationItemResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy mặt hàng đề xuất (RESOURCE_NOT_FOUND)',
  })
  async explainItem(
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<ExplainRecommendationItemResponseDto> {
    return await this.explainabilityService.explainItem(itemId);
  }

  @Post('sessions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @AuditLog({
    action: 'DSS_APPROVE_SESSION',
    entityType: 'RecommendationSession',
    description:
      'Phê duyệt phiên đề xuất mua hàng và tự động sinh các đơn PO theo NCC',
  })
  @ApiOperation({
    summary:
      'Phê duyệt phiên phân tích và tự động sinh Purchase Orders (Approve Session)',
    description:
      'Chốt duyệt giỏ hàng trong ACID Transaction: Cập nhật session sang Approved, tạo các đơn purchase_orders gom theo NCC (kèm snapshot giá, MOQ, lead time), và tự động tăng on_order_quantity cho từng SKU.',
  })
  @ApiResponse({
    status: 200,
    description: 'Phê duyệt phiên phân tích và sinh đơn PO thành công',
    type: ApproveSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Phiên phân tích không ở trạng thái Draft (SESSION_NOT_IN_DRAFT)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phiên phân tích (RESOURCE_NOT_FOUND)',
  })
  async approveSession(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApproveSessionResponseDto> {
    return await this.approvalService.approveSession(id);
  }

  @Get('sessions/:id/evaluation')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary:
      'Đánh giá độ chính xác và đối soát kết quả dự báo phiên DSS (Evaluate Session Accuracy)',
    description:
      'Đối soát số lượng nhu cầu dự báo đã lưu trong phiên DSS với doanh số bán hàng thực tế đã ghi nhận trong cùng kỳ (từ sales_records). Tính toán WAPE, MAPE, MAE, Forecast Bias và xếp hạng chất lượng dự báo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy kết quả đánh giá đối soát phiên DSS thành công',
    type: DssSessionEvaluationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phiên phân tích (RESOURCE_NOT_FOUND)',
  })
  async evaluateSession(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DssSessionEvaluationResponseDto> {
    return await this.evaluationService.evaluateSession(BigInt(id));
  }
}
