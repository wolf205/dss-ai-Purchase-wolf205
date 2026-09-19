import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ description: 'Tên đăng nhập', example: 'manager_an' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username!: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'SecretPassword123!' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access Token (JWT)', example: 'eyJhbGciOi...' })
  accessToken!: string;

  @ApiProperty({ description: 'Thông tin người dùng cơ bản' })
  user!: {
    id: string; // Trả về dạng string để tránh lỗi serialize BigInt
    username: string;
    role: string;
  };
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'Access Token (JWT) mới', example: 'eyJhbGciOi...' })
  accessToken!: string;
}
