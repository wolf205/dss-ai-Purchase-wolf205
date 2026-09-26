import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Res,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/auth-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @AuditLog({
    action: 'AUTH_LOGIN',
    entityType: 'User',
    entityId: (_req, resData) =>
      (
        resData as Record<string, unknown> & {
          user?: { id?: string | number | bigint };
        }
      )?.user?.id?.toString(),
    description: 'Đăng nhập vào hệ thống',
  })
  @Post('login')
  async login(
    @Body() loginDto: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Sai tên đăng nhập hoặc mật khẩu',
      });
    }

    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(user, clientIp, userAgent);

    // Set Refresh Token into HttpOnly Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Cấp mới Access Token (Token Rotation)' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, type: RefreshResponseDto })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Không tìm thấy Refresh Token',
      });
    }

    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.refreshTokens(
      refreshToken,
      clientIp,
      userAgent,
    );

    // Update Refresh Token into HttpOnly Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @AuditLog({
    action: 'AUTH_LOGOUT',
    entityType: 'User',
    description: 'Đăng xuất khỏi hệ thống',
  })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return { message: 'Đăng xuất thành công' };
  }

  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    // payload JWT chứa sub là id dạng string
    const fullUser = await this.usersService.findById(BigInt(user.id));
    if (!fullUser) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Không tìm thấy người dùng',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = fullUser;

    return {
      ...result,
      id: result.id.toString(), // Convert BigInt
    };
  }

  @ApiOperation({ summary: 'Test endpoint cho STORE_MANAGER' })
  @ApiBearerAuth('access-token')
  @Roles(Role.STORE_MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin-only')
  adminOnly() {
    return { message: 'Bạn đang truy cập với quyền STORE_MANAGER' };
  }
}
