/**
 * Helper tính toán trạng thái Quá hạn giao hàng runtime cho Đơn mua hàng (BR-09).
 *
 * Quy tắc BR-09 (PO Overdue Identification Rule):
 * - Đơn mua hàng được coi là "Quá hạn giao" (Overdue) khi và chỉ khi:
 *   1. Trạng thái đơn vẫn là 'Approved' (chưa hoàn tất nhận hàng hoặc chưa hủy).
 *   2. Ngày giao hàng dự kiến (expectedDeliveryDate) nhỏ hơn Ngày hiện tại (TODAY, 00:00:00).
 * - Đơn đã ở trạng thái 'Completed' hoặc 'Cancelled' KHÔNG BAO GIỜ bị đánh dấu là Overdue.
 */

export function getStartOfDay(dateInput: Date | string): Date {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isPoOverdue(
  status: string,
  expectedDeliveryDate: Date | string,
  referenceDate: Date = new Date(),
): boolean {
  if (status !== 'Approved') {
    return false;
  }

  const expectedDate = getStartOfDay(expectedDeliveryDate);
  const today = getStartOfDay(referenceDate);

  return expectedDate.getTime() < today.getTime();
}
