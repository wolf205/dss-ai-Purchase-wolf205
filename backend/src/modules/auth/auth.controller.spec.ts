import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    moduleRef = module;
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user and set cookie', async () => {
      const mockUser = { id: '1', username: 'admin', role: 'STORE_MANAGER' };
      const mockResult = { accessToken: 'token', refreshToken: 'ref-token', user: mockUser };
      
      const authService = moduleRef.get<AuthService>(AuthService);
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      const mockReq = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } };
      const mockRes = { cookie: jest.fn() };

      const result = await controller.login({ username: 'admin', password: 'password' }, mockReq as any, mockRes as any);

      expect(result).toEqual({ accessToken: 'token', user: mockUser });
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'ref-token', expect.any(Object));
    });

    it('should throw UnauthorizedException if login fails', async () => {
      const authService = moduleRef.get<AuthService>(AuthService);
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      const mockReq = { ip: '127.0.0.1', headers: {} };
      const mockRes = { cookie: jest.fn() };

      await expect(
        controller.login({ username: 'admin', password: 'wrong' }, mockReq as any, mockRes as any)
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
