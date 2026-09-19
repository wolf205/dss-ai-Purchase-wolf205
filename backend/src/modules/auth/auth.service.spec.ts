import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let jwtService: JwtService;

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
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const mockPassword = 'password123';
      const mockHash = await bcrypt.hash(mockPassword, 10);
      const mockUser = { id: 1n, username: 'admin', status: 'Active', passwordHash: mockHash };
      
      (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.validateUser('admin', mockPassword);
      expect(result).toBeDefined();
      expect(result?.username).toBe('admin');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should return null if password does not match', async () => {
      const mockHash = await bcrypt.hash('correct_password', 10);
      const mockUser = { id: 1n, username: 'admin', status: 'Active', passwordHash: mockHash };
      
      (usersService.findByUsername as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'wrong_password');
      expect(result).toBeNull();
    });
  });
});
