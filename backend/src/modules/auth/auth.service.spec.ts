import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, SafeUser } from './auth.service';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(7),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without passwordHash if credentials are valid', async () => {
      const mockPassword = 'password123';
      const mockHash = await bcrypt.hash(mockPassword, 10);
      const mockUser = {
        id: 1n,
        username: 'admin',
        status: 'Active',
        passwordHash: mockHash,
      };

      (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.validateUser('admin', mockPassword);
      expect(result).toBeDefined();
      expect(result?.username).toBe('admin');
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should return null if password does not match', async () => {
      const mockHash = await bcrypt.hash('correct_password', 10);
      const mockUser = {
        id: 1n,
        username: 'admin',
        status: 'Active',
        passwordHash: mockHash,
      };

      (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'wrong_password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate tokens and save refresh token', async () => {
      const mockUser = { id: 1n, username: 'admin', role: 'STORE_MANAGER' };
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.login(
        mockUser as unknown as SafeUser,
        '127.0.0.1',
        'jest-agent',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token is revoked', async () => {
      const mockToken = {
        id: 1n,
        userId: 1n,
        revokedAt: new Date(),
        user: { status: 'Active' },
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken,
      );
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({});

      await expect(
        service.refreshTokens('old-token', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1n },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
