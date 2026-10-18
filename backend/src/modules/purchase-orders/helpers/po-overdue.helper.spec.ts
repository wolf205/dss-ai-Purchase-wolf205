import { isPoOverdue, getStartOfDay } from './po-overdue.helper';

describe('po-overdue.helper', () => {
  const referenceDate = new Date('2026-10-18T10:00:00.000Z');

  describe('getStartOfDay', () => {
    it('should set hours, minutes, seconds and ms to zero', () => {
      const date = getStartOfDay('2026-10-18T14:35:20.123Z');
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });
  });

  describe('isPoOverdue (BR-09)', () => {
    it('should return true when status is Approved and expectedDeliveryDate < TODAY', () => {
      const yesterday = '2026-10-17';
      expect(isPoOverdue('Approved', yesterday, referenceDate)).toBe(true);
    });

    it('should return false when status is Approved and expectedDeliveryDate is TODAY', () => {
      const today = '2026-10-18';
      expect(isPoOverdue('Approved', today, referenceDate)).toBe(false);
    });

    it('should return false when status is Approved and expectedDeliveryDate is in the future', () => {
      const tomorrow = '2026-10-19';
      expect(isPoOverdue('Approved', tomorrow, referenceDate)).toBe(false);
    });

    it('should return false when status is Completed even if expectedDeliveryDate is in the past', () => {
      const lastWeek = '2026-10-10';
      expect(isPoOverdue('Completed', lastWeek, referenceDate)).toBe(false);
    });

    it('should return false when status is Cancelled even if expectedDeliveryDate is in the past', () => {
      const lastWeek = '2026-10-10';
      expect(isPoOverdue('Cancelled', lastWeek, referenceDate)).toBe(false);
    });
  });
});
