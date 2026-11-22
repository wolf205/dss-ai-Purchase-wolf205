import { DssSessionCodeGenerator } from './dss-session-code.generator';
import { PrismaService } from '../../prisma/prisma.service';

describe('DssSessionCodeGenerator', () => {
  it('should generate code in format REC-YYYYMMDD-001 when count is 0', async () => {
    const mockPrisma = {
      recommendationSession: {
        count: jest.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaService;

    const testDate = new Date('2026-10-15T00:00:00.000Z');
    const code = await DssSessionCodeGenerator.generate(mockPrisma, testDate);

    expect(code).toBe('REC-20261015-001');
    expect(mockPrisma.recommendationSession.count).toHaveBeenCalledWith({
      where: {
        sessionCode: { startsWith: 'REC-20261015-' },
      },
    });
  });

  it('should increment sequence number correctly', async () => {
    const mockPrisma = {
      recommendationSession: {
        count: jest.fn().mockResolvedValue(4),
      },
    } as unknown as PrismaService;

    const testDate = new Date('2026-10-15T00:00:00.000Z');
    const code = await DssSessionCodeGenerator.generate(mockPrisma, testDate);

    expect(code).toBe('REC-20261015-005');
  });
});
