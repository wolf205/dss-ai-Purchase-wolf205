import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { DssConfigurationResponseDto } from './dto/dss-configuration-response.dto';
import { UpdateDssConfigurationDto } from './dto/update-dss-configuration.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { Role } from '../../common/enums/role.enum';

describe('ConfigurationController', () => {
  let controller: ConfigurationController;
  let service: ConfigurationService;

  const mockConfig: DssConfigurationResponseDto = {
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
  };

  const mockUpdatedConfig: DssConfigurationResponseDto = {
    ...mockConfig,
    priceWeight: 0.35,
    leadTimeWeight: 0.25,
    moqWeight: 0.2,
    historyWeight: 0.2,
    weightPrice: 0.35,
    weightLeadTime: 0.25,
    weightMoq: 0.2,
    weightHistory: 0.2,
    targetServiceLevel: 0.98,
    zFactor: 2.05,
    reviewPeriodDays: 14,
    updatedBy: 'manager_an',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigurationController],
      providers: [
        {
          provide: ConfigurationService,
          useValue: {
            getConfiguration: jest.fn().mockResolvedValue(mockConfig),
            updateConfiguration: jest.fn().mockResolvedValue(mockUpdatedConfig),
            resetToDefaults: jest.fn().mockResolvedValue(mockConfig),
          },
        },
      ],
    }).compile();

    controller = module.get<ConfigurationController>(ConfigurationController);
    service = module.get<ConfigurationService>(ConfigurationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getConfiguration', () => {
    it('should return the singleton DSS configuration', async () => {
      const result = await controller.getConfiguration();

      expect(service.getConfiguration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConfig);
      expect(result.id).toBe(1);
      expect(result.priceWeight).toBe(0.4);
      expect(result.targetServiceLevel).toBe(0.95);
      expect(result.zFactor).toBe(1.65);
      expect(result.reviewPeriodDays).toBe(7);
    });
  });

  describe('updateConfiguration', () => {
    it('should call service.updateConfiguration with dto and current user username', async () => {
      const dto: UpdateDssConfigurationDto = {
        weightPrice: 0.35,
        weightLeadTime: 0.25,
        weightMoq: 0.2,
        weightHistory: 0.2,
        targetServiceLevel: 0.98,
        reviewPeriodDays: 14,
      };

      const user: AuthenticatedUser = {
        id: '1',
        username: 'manager_an',
        role: Role.STORE_MANAGER,
      };

      const result = await controller.updateConfiguration(dto, user);

      expect(service.updateConfiguration).toHaveBeenCalledWith(
        dto,
        'manager_an',
      );
      expect(result).toEqual(mockUpdatedConfig);
      expect(result.targetServiceLevel).toBe(0.98);
      expect(result.zFactor).toBe(2.05);
      expect(result.updatedBy).toBe('manager_an');
    });
  });

  describe('resetToDefaults', () => {
    it('should call service.resetToDefaults with current user username and return reset config', async () => {
      const user: AuthenticatedUser = {
        id: '1',
        username: 'manager_an',
        role: Role.STORE_MANAGER,
      };

      const result = await controller.resetToDefaults(user);

      expect(service.resetToDefaults).toHaveBeenCalledWith('manager_an');
      expect(result).toEqual(mockConfig);
      expect(result.priceWeight).toBe(0.4);
      expect(result.targetServiceLevel).toBe(0.95);
      expect(result.zFactor).toBe(1.65);
      expect(result.reviewPeriodDays).toBe(7);
    });
  });
});
