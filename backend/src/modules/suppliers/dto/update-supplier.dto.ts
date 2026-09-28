import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({
    description: 'Tên đầy đủ của doanh nghiệp hoặc nhà phân phối',
    example: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @MaxLength(255, { message: 'Tên nhà cung cấp tối đa 255 ký tự' })
  supplierName?: string;

  @ApiPropertyOptional({
    description: 'Họ tên người đại diện liên hệ hoặc nhân viên phụ trách',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Người liên hệ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Người liên hệ không được để trống' })
  @MaxLength(100, { message: 'Người liên hệ tối đa 100 ký tự' })
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại liên lạc chính thức',
    example: '0901234567',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @MaxLength(50, { message: 'Số điện thoại tối đa 50 ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description:
      'Thời gian giao hàng cam kết tiêu chuẩn (Lead Time tính theo ngày, >= 1)',
    example: 3,
  })
  @IsOptional()
  @IsInt({ message: 'Thời gian giao cam kết phải là số nguyên' })
  @Min(1, { message: 'Thời gian giao cam kết phải lớn hơn hoặc bằng 1 ngày' })
  committedLeadTimeDays?: number;

  @ApiPropertyOptional({
    description:
      'Địa chỉ thư điện tử giao dịch (truyền chuỗi mới để đổi, hoặc null / "" để xóa)',
    example: 'sales@vinamilk.com.vn',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  })
  @ValidateIf((_obj, val) => val !== null && val !== undefined)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100, { message: 'Email tối đa 100 ký tự' })
  email?: string | null;

  @ApiPropertyOptional({
    description:
      'Địa chỉ kho xuất hàng hoặc văn phòng đại diện (truyền chuỗi mới để đổi, hoặc null / "" để xóa)',
    example: '10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  })
  @ValidateIf((_obj, val) => val !== null && val !== undefined)
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Địa chỉ tối đa 500 ký tự' })
  address?: string | null;
}
