import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && user.status === 'Active') {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        // Cập nhật last_login_at
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Loại bỏ passwordHash trước khi trả về
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any, clientIp?: string, userAgent?: string) {
    const payload = { username: user.username, sub: user.id.toString(), role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Tạo Refresh Token an toàn
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresInDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Lưu vào database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        clientIp,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string, clientIp?: string, userAgent?: string) {
    // Hash token được gửi lên để tra cứu
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Refresh token không hợp lệ' });
    }

    // Cơ chế chống Replay Attack: Nếu token đã bị revoked mà vẫn dùng lại -> Thu hồi TOÀN BỘ token của user đó
    if (tokenRecord.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({ code: 'TOKEN_REVOKED', message: 'Phát hiện hành vi tái sử dụng token. Vui lòng đăng nhập lại.' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Refresh token đã hết hạn' });
    }

    // Lấy thông tin user
    const user = tokenRecord.user;
    if (user.status !== 'Active') {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Tài khoản đã bị khóa' });
    }

    // Token Rotation: Thu hồi token cũ, cấp cặp token mới
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.login(user, clientIp, userAgent);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
