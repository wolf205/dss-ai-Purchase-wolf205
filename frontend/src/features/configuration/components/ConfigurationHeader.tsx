import React from 'react';
import {
  Sliders,
  RefreshCw,
  Save,
  Clock,
  UserCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface ConfigurationHeaderProps {
  updatedBy?: string;
  updatedAt?: string;
  isReadOnly: boolean;
  isDirty: boolean;
  isValid: boolean;
  isSaving: boolean;
  onSave: () => void;
  onOpenResetModal: () => void;
}

export const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = ({
  updatedBy = 'System',
  updatedAt,
  isReadOnly,
  isDirty,
  isValid,
  isSaving,
  onSave,
  onOpenResetModal,
}) => {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Mặc định hệ thống';

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white shadow-2xs">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Thiết Lập DSS (UC-07)
              </span>

              {isDirty && !isReadOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cấu Hình Tham Số DSS & Trọng Số WSM
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Trung tâm điều khiển chiến lược mua hàng toàn cửa hàng. Tùy chỉnh trọng số đánh giá Nhà cung cấp, mức độ phục vụ mong muốn và chu kỳ rà soát đặt hàng để định hướng thuật toán gợi ý tại UC-01.
            </p>
          </div>

          {/* Action Buttons for Manager */}
          {!isReadOnly && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenResetModal}
                disabled={isSaving}
                leftIcon={<RefreshCw className="w-4 h-4 text-slate-500" />}
              >
                Khôi Phục Mặc Định
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={!isValid || !isDirty || isSaving}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4 text-blue-400" />}
              >
                Lưu Thay Đổi
              </Button>
            </div>
          )}
        </div>

        {/* Audit Meta Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>Người cập nhật gần nhất:</span>
              <strong className="text-slate-800 font-medium">
                {updatedBy}
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Thời gian cập nhật:</span>
              <strong className="text-slate-800 font-mono">
                {formattedDate}
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Hiệu lực tức thì về sau (Forward-looking, BR-28)
          </div>
        </div>
      </div>

      {/* Read-only Banner for Staff */}
      {isReadOnly && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block text-blue-950 mb-0.5">
              Chế độ tra cứu Chỉ đọc (Read-only — AF-2)
            </strong>
            Bạn đang đăng nhập với vai trò <strong>Nhân Viên Mua Hàng (Purchasing Staff)</strong>. Bạn có quyền xem toàn bộ tham số cấu hình hiện hành để hiểu rõ căn cứ thuật toán DSS đưa ra gợi ý, nhưng chỉ <strong>Quản Lý Cửa Hàng (Store Manager)</strong> mới có quyền điều chỉnh và lưu thay đổi.
          </div>
        </div>
      )}

      {/* Validation Alert when Total Weight != 100 */}
      {!isValid && !isReadOnly && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Ràng buộc chuẩn hóa (BR-25, EF-1):</strong> Tổng 4 trọng số WSM bắt buộc phải bằng chính xác 100%. Vui lòng điều chỉnh lại thanh trượt hoặc chọn một Chiến lược nhanh để kích hoạt nút Lưu.
          </div>
        </div>
      )}
    </div>
  );
};
