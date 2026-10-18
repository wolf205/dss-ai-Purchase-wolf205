import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ExportPurchaseOrderQueryDto {
  @ApiPropertyOptional({
    description: 'Định dạng xuất chứng từ đơn mua hàng: pdf hoặc excel',
    enum: ['pdf', 'excel'],
    default: 'pdf',
    example: 'pdf',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pdf', 'excel'], {
    message: 'format phải là "pdf" hoặc "excel".',
  })
  format?: 'pdf' | 'excel' = 'pdf';
}
