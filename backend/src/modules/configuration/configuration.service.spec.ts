import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  ConfigurationService,
  DEFAULT_DSS_CONFIGURATION,
  SERVICE_LEVEL_Z_MAP,
} from './configuration.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { DSSConfiguration } from '@prisma/client';
import { UpdateDssConfigurationDto } from './dto/update-dss-configuration.dto';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let prisma: PrismaService;

  const mockDbRecord: DSSConfiguration = {
    id: 1,
    priceWeight: new Decimal(0.4),
    leadTimeWeight: new Decimal(0.2),
    moqWeight: new Decimal(0.15),
    historyWeight: new Decimal(0.25),
    targetServiceLevel: new Decimal(0.95),
    zFactor: new Decimal(1.65),
    reviewPeriodDays: 7,
    updatedBy: 'Store Manager',
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
  };

  const mockPrismaService = {
    dSSConfiguration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('SERVICE_LEVEL_Z_MAP', () => {
    it('should map the 4 discrete standard service levels to corresponding Z factors (BR-26)', () => {
      expect(SERVICE_LEVEL_Z_MAP[0.9]).toBe(1.28);
      expect(SERVICE_LEVEL_Z_MAP[0.95]).toBe(1.65);
      expect(SERVICE_LEVEL_Z_MAP[0.98]).toBe(2.05);
      expect(SERVICE_LEVEL_Z_MAP[0.99]).toBe(2.33);
    });
  });

  describe('DEFAULT_DSS_CONFIGURATION', () => {
    it('should match the system default baseline defined in BR-28', () => {
      expect(DEFAULT_DSS_CONFIGURATION).toEqual({
        priceWeight: 0.4,
        leadTimeWeight: 0.2,
        moqWeight: 0.15,
        historyWeight: 0.25,
        targetServiceLevel: 0.95,
        zFactor: 1.65,
        reviewPeriodDays: 7,
      });
    });
  });

  describe('getConfiguration', () => {
    it('should return existing singleton configuration when found', async () => {
      mockPrismaService.dSSConfiguration.findUnique.mockResolvedValue(
        mockDbRecord,
      );

      const result = await service.getConfiguration();

      expect(prisma.dSSConfiguration.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.dSSConfiguration.upsert).not.toHaveBeenCalled();

      expect(result).toEqual({
        id: 1,
        priceWeight: 0.4,
        leadTimeWeight: 0.2,
        moqWeight: 0.15,
        historyWeight: 0.25,
        weightPrice: 0.4,
        weightLeadTime: 0.2,
        weightMoq: 0.15,
        weightHistory: 0.25,
        targetServiceLevel: 0.95,
        zFactor: 1.65,
        reviewPeriodDays: 7,
        updatedBy: 'Store Manager',
        createdAt: '2026-09-15T08:00:00.000Z',
        updatedAt: '2026-09-15T08:00:00.000Z',
      });
    });

    it('should auto-create default baseline configuration when record id=1 is missing (INV-CONF-05 / BR-28)', async () => {
      mockPrismaService.dSSConfiguration.findUnique.mockResolvedValue(null);
      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue({
        ...mockDbRecord,
        updatedBy: 'System',
      });

      const result = await service.getConfiguration();

      expect(prisma.dSSConfiguration.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.dSSConfiguration.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          priceWeight: 0.4,
          leadTimeWeight: 0.2,
          moqWeight: 0.15,
          historyWeight: 0.25,
          targetServiceLevel: 0.95,
          zFactor: 1.65,
          reviewPeriodDays: 7,
          updatedBy: 'System',
        },
      });

      expect(result.id).toBe(1);
      expect(result.updatedBy).toBe('System');
      expect(result.priceWeight).toBe(0.4);
      expect(result.reviewPeriodDays).toBe(7);
    });
  });

  describe('updateConfiguration', () => {
    it('should successfully update configuration and auto-calculate zFactor (BR-25, BR-26, BR-27)', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.35,
        weightLeadTime: 0.25,
        weightMoq: 0.2,
        weightHistory: 0.2,
        targetServiceLevel: 0.98,
        reviewPeriodDays: 14,
      };

      const updatedRecord: DSSConfiguration = {
        id: 1,
        priceWeight: new Decimal(0.35),
        leadTimeWeight: new Decimal(0.25),
        moqWeight: new Decimal(0.2),
        historyWeight: new Decimal(0.2),
        targetServiceLevel: new Decimal(0.98),
        zFactor: new Decimal(2.05),
        reviewPeriodDays: 14,
        updatedBy: 'manager_an',
        createdAt: new Date('2026-09-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-04T12:00:00.000Z'),
      };

      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue(
        updatedRecord,
      );

      const result = await service.updateConfiguration(dto, 'manager_an');

      expect(prisma.dSSConfiguration.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          priceWeight: 0.35,
          leadTimeWeight: 0.25,
          moqWeight: 0.2,
          historyWeight: 0.2,
          targetServiceLevel: 0.98,
          zFactor: 2.05,
          reviewPeriodDays: 14,
          updatedBy: 'manager_an',
        },
        create: {
          id: 1,
          priceWeight: 0.35,
          leadTimeWeight: 0.25,
          moqWeight: 0.2,
          historyWeight: 0.2,
          targetServiceLevel: 0.98,
          zFactor: 2.05,
          reviewPeriodDays: 14,
          updatedBy: 'manager_an',
        },
      });

      expect(result.priceWeight).toBe(0.35);
      expect(result.zFactor).toBe(2.05);
      expect(result.reviewPeriodDays).toBe(14);
      expect(result.updatedBy).toBe('manager_an');
    });

    it('should support alternative property names (priceWeight, leadTimeWeight, etc.)', async () => {
      const dto: UpdateDssConfigurationDto = {
        priceWeight: 0.4,
        leadTimeWeight: 0.2,
        moqWeight: 0.15,
        historyWeight: 0.25,
        targetServiceLevel: 0.9,
        reviewPeriodDays: 5,
      };

      const updatedRecord: DSSConfiguration = {
        id: 1,
        priceWeight: new Decimal(0.4),
        leadTimeWeight: new Decimal(0.2),
        moqWeight: new Decimal(0.15),
        historyWeight: new Decimal(0.25),
        targetServiceLevel: new Decimal(0.9),
        zFactor: new Decimal(1.28),
        reviewPeriodDays: 5,
        updatedBy: 'Store Manager',
        createdAt: new Date('2026-09-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-04T12:00:00.000Z'),
      };

      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue(
        updatedRecord,
      );

      const result = await service.updateConfiguration(dto);

      expect(result.priceWeight).toBe(0.4);
      expect(result.zFactor).toBe(1.28);
      expect(result.reviewPeriodDays).toBe(5);
    });

    it('should accept floating-point weights sum within tolerance ±0.001', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.333,
        weightLeadTime: 0.333,
        weightMoq: 0.167,
        weightHistory: 0.167,
        targetServiceLevel: 0.99,
        reviewPeriodDays: 7,
      };

      const updatedRecord: DSSConfiguration = {
        id: 1,
        priceWeight: new Decimal(0.333),
        leadTimeWeight: new Decimal(0.333),
        moqWeight: new Decimal(0.167),
        historyWeight: new Decimal(0.167),
        targetServiceLevel: new Decimal(0.99),
        zFactor: new Decimal(2.33),
        reviewPeriodDays: 7,
        updatedBy: 'Store Manager',
        createdAt: new Date('2026-09-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-04T12:00:00.000Z'),
      };

      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue(
        updatedRecord,
      );

      const result = await service.updateConfiguration(dto);

      expect(result.zFactor).toBe(2.33);
      expect(prisma.dSSConfiguration.upsert).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException (SUM_WEIGHT_NOT_100) when sum of 4 weights is greater than 1.0 (e.g. 1.05)', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.4,
        weightLeadTime: 0.25,
        weightMoq: 0.2,
        weightHistory: 0.2, // sum = 1.05
        targetServiceLevel: 0.95,
        reviewPeriodDays: 7,
      };

      try {
        await service.updateConfiguration(dto);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.code).toBe('SUM_WEIGHT_NOT_100');
        expect(response.message).toContain('105.0%');
      }

      expect(prisma.dSSConfiguration.upsert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (SUM_WEIGHT_NOT_100) when sum of 4 weights is less than 1.0 (e.g. 0.90)', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.3,
        weightLeadTime: 0.2,
        weightMoq: 0.2,
        weightHistory: 0.2, // sum = 0.90
        targetServiceLevel: 0.95,
        reviewPeriodDays: 7,
      };

      try {
        await service.updateConfiguration(dto);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.code).toBe('SUM_WEIGHT_NOT_100');
        expect(response.message).toContain('90.0%');
      }

      expect(prisma.dSSConfiguration.upsert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when any weight is missing', async () => {
      const dto = {
        weightPrice: 0.5,
        weightLeadTime: 0.3,
        // weightMoq and weightHistory missing
        targetServiceLevel: 0.95,
        reviewPeriodDays: 7,
      } as UpdateDssConfigurationDto;

      try {
        await service.updateConfiguration(dto);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.code).toBe('VALIDATION_ERROR');
      }

      expect(prisma.dSSConfiguration.upsert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when targetServiceLevel is invalid', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.4,
        weightLeadTime: 0.2,
        weightMoq: 0.15,
        weightHistory: 0.25,
        targetServiceLevel: 0.85, // Not in [0.90, 0.95, 0.98, 0.99]
        reviewPeriodDays: 7,
      };

      try {
        await service.updateConfiguration(dto);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.code).toBe('VALIDATION_ERROR');
      }

      expect(prisma.dSSConfiguration.upsert).not.toHaveBeenCalled();
    });
  });

  describe('resetToDefaults', () => {
    it('should reset DSS configuration to system default baseline (BR-28, AF-1)', async () => {
      const defaultRecord: DSSConfiguration = {
        id: 1,
        priceWeight: new Decimal(0.4),
        leadTimeWeight: new Decimal(0.2),
        moqWeight: new Decimal(0.15),
        historyWeight: new Decimal(0.25),
        targetServiceLevel: new Decimal(0.95),
        zFactor: new Decimal(1.65),
        reviewPeriodDays: 7,
        updatedBy: 'manager_an',
        createdAt: new Date('2026-09-15T08:00:00.000Z'),
        updatedAt: new Date('2026-10-04T12:00:00.000Z'),
      };

      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue(
        defaultRecord,
      );

      const result = await service.resetToDefaults('manager_an');

      expect(prisma.dSSConfiguration.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          priceWeight: 0.4,
          leadTimeWeight: 0.2,
          moqWeight: 0.15,
          historyWeight: 0.25,
          targetServiceLevel: 0.95,
          zFactor: 1.65,
          reviewPeriodDays: 7,
          updatedBy: 'manager_an',
        },
        create: {
          id: 1,
          priceWeight: 0.4,
          leadTimeWeight: 0.2,
          moqWeight: 0.15,
          historyWeight: 0.25,
          targetServiceLevel: 0.95,
          zFactor: 1.65,
          reviewPeriodDays: 7,
          updatedBy: 'manager_an',
        },
      });

      expect(result.priceWeight).toBe(0.4);
      expect(result.leadTimeWeight).toBe(0.2);
      expect(result.moqWeight).toBe(0.15);
      expect(result.historyWeight).toBe(0.25);
      expect(result.targetServiceLevel).toBe(0.95);
      expect(result.zFactor).toBe(1.65);
      expect(result.reviewPeriodDays).toBe(7);
      expect(result.updatedBy).toBe('manager_an');
    });

    it('should fallback to Store Manager as updatedBy when username is undefined', async () => {
      mockPrismaService.dSSConfiguration.upsert.mockResolvedValue(mockDbRecord);

      await service.resetToDefaults();

      expect(prisma.dSSConfiguration.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          ...DEFAULT_DSS_CONFIGURATION,
          updatedBy: 'Store Manager',
        },
        create: {
          id: 1,
          ...DEFAULT_DSS_CONFIGURATION,
          updatedBy: 'Store Manager',
        },
      });
    });
  });

  describe('mapToResponseDto', () => {
    it('should correctly convert Decimal fields to number and dates to ISO string', () => {
      const result = service.mapToResponseDto(mockDbRecord);

      expect(typeof result.priceWeight).toBe('number');
      expect(result.priceWeight).toBe(0.4);
      expect(typeof result.leadTimeWeight).toBe('number');
      expect(result.leadTimeWeight).toBe(0.2);
      expect(typeof result.moqWeight).toBe('number');
      expect(result.moqWeight).toBe(0.15);
      expect(typeof result.historyWeight).toBe('number');
      expect(result.historyWeight).toBe(0.25);
      expect(typeof result.targetServiceLevel).toBe('number');
      expect(result.targetServiceLevel).toBe(0.95);
      expect(typeof result.zFactor).toBe('number');
      expect(result.zFactor).toBe(1.65);
      expect(result.createdAt).toBe('2026-09-15T08:00:00.000Z');
      expect(result.updatedAt).toBe('2026-09-15T08:00:00.000Z');
    });
  });
});
