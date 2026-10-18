import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  RotateCcw,
  Search,
  Filter,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ImportErrorDetail, ImportType } from '../types';

interface ImportErrorTableProps {
  type: ImportType;
  errors: ImportErrorDetail[];
  message: string;
  onReset: () => void;
}

export const ImportErrorTable: React.FC<ImportErrorTableProps> = ({
  errors,
  message,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc lỗi theo từ khóa tìm kiếm (SKU hoặc nội dung lỗi)
  const filteredErrors = useMemo(() => {
    if (!searchTerm.trim()) return errors;
    const lower = searchTerm.trim().toLowerCase();
    return errors.filter(
      (err) =>
        err.issue.toLowerCase().includes(lower) ||
        (err.skuCode && err.skuCode.toLowerCase().includes(lower)) ||
        err.row.toString().includes(lower)
    );
  }, [errors, searchTerm]);

  return (
    <div className="space-y-5 animate-toast-enter">
      {/* 1. Banner Từ Chối Toàn Bộ Tệp (All-or-Nothing) */}
      <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-rose-950">
                  Từ Chối Tiếp Nhận — Vi Phạm Quy Tắc All-or-Nothing (BR-14)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-900">
                  REJECTED
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                {message ||
                  'File import chứa dữ liệu không hợp lệ. Để đảm bảo chất lượng mô hình DSS ("Garbage In, Garbage Out"), hệ thống từ chối nạp toàn bộ tệp cho đến khi 100% dòng lỗi được sửa sạch.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 shadow-2xs">
              {errors.length} dòng vi phạm
            </span>
          </div>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm / Lọc Lỗi */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã SKU, số dòng hoặc lý do lỗi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-center">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Đang hiển thị {filteredErrors.length} / {errors.length} lỗi
          </span>
        </div>
      </div>

      {/* 3. Bảng Chi Tiết Lỗi Từng Dòng */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Danh Sách Dòng Vi Phạm Ràng Buộc Dữ Liệu
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Cột: [Số Dòng] | [Mã SKU] | [Nguyên Nhân Vi Phạm]
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5 text-center w-16">#</th>
                <th className="px-4 py-2.5 w-28 text-center">Dòng Trong File</th>
                <th className="px-4 py-2.5 w-44">Mã SKU</th>
                <th className="px-4 py-2.5">Chi Tiết Lỗi Vi Phạm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredErrors.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-400 text-xs italic"
                  >
                    Không tìm thấy lỗi phù hợp với từ khóa &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredErrors.map((err, idx) => (
                  <tr
                    key={`err-${err.row}-${err.skuCode}-${idx}`}
                    className="hover:bg-rose-50/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                        Dòng {err.row}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                      {err.skuCode ? (
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {err.skuCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">
                          (Không có / Rỗng)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-rose-700 font-medium">
                      {err.issue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Hướng dẫn khắc phục sự cố */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              Mẹo sửa lỗi tệp nguồn nhanh:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
              <li>
                <strong>Mã SKU không tồn tại:</strong> Kiểm tra lại mã sản phẩm
                hoặc khai báo mới sản phẩm tại Phân hệ Danh mục (UC-05).
              </li>
              <li>
                <strong>Số lượng âm / khuyết thiếu:</strong> Điền đầy đủ giá trị
                dương cho số lượng bán hoặc $\ge 0$ cho tồn kho.
              </li>
              <li>
                <strong>Ngày tương lai / sai định dạng:</strong> Đảm bảo ngày
                theo mẫu <code>YYYY-MM-DD</code> và không vượt quá ngày hôm nay.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Nút Chọn Lại File */}
      <div className="flex items-center justify-end pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={onReset}
          className="bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Sửa Xong & Tải Lại Tệp Mới
        </Button>
      </div>
    </div>
  );
};
