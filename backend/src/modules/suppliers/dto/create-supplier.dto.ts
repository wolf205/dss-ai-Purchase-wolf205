import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    description:
      'Mã nhà cung cấp duy nhất toàn hệ thống (chỉ gồm chữ cái, chữ số, -, _)',
    example: 'VINAMILK',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Mã nhà cung cấp phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã nhà cung cấp không được để trống' })
  @MaxLength(50, { message: 'Mã nhà cung cấp tối đa 50 ký tự' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Mã nhà cung cấp chỉ được phép chứa chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_)',
  })
  supplierCode!: string;

  @ApiProperty({
    description: 'Tên đầy đủ của doanh nghiệp hoặc nhà phân phối',
    example: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @MaxLength(255, { message: 'Tên nhà cung cấp tối đa 255 ký tự' })
  supplierName!: string;

  @ApiProperty({
    description: 'Họ tên người đại diện liên hệ hoặc nhân viên phụ trách',
    example: 'Nguyễn Văn A',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Người liên hệ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Người liên hệ không được để trống' })
  @MaxLength(100, { message: 'Người liên hệ tối đa 100 ký tự' })
  contactPerson!: string;

  @ApiProperty({
    description: 'Số điện thoại liên lạc chính thức',
    example: '0901234567',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @MaxLength(50, { message: 'Số điện thoại tối đa 50 ký tự' })
  phoneNumber!: string;

  @ApiProperty({
    description:
      'Thời gian giao hàng cam kết tiêu chuẩn (Lead Time tính theo ngày, >= 1)',
    example: 3,
  })
  @IsInt({ message: 'Thời gian giao cam kết phải là số nguyên' })
  @Min(1, { message: 'Thời gian giao cam kết phải lớn hơn hoặc bằng 1 ngày' })
  committedLeadTimeDays!: number;

  @ApiPropertyOptional({
    description: 'Địa chỉ thư điện tử giao dịch',
    example: 'sales@vinamilk.com.vn',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100, { message: 'Email tối đa 100 ký tự' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ văn phòng hoặc kho hàng của đối tác',
    example: '10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Địa chỉ tối đa 500 ký tự' })
  address?: string;
}
