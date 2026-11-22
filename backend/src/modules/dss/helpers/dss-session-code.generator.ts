import { PrismaService } from '../../prisma/prisma.service';

export class DssSessionCodeGenerator {
  /**
   * Sinh mã phiên đề xuất theo quy chuẩn: REC-YYYYMMDD-XXX
   */
  static async generate(
    prisma: PrismaService,
    asOfDate?: Date,
  ): Promise<string> {
    const today = asOfDate || new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `REC-${yyyy}${mm}${dd}-`;

    const countToday = await prisma.recommendationSession.count({
      where: {
        sessionCode: { startsWith: prefix },
      },
    });

    const seq = String(countToday + 1).padStart(3, '0');
    return `${prefix}${seq}`;
  }
}
