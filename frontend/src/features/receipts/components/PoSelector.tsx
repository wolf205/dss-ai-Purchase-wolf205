import React, { useState, useMemo } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building2,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { PendingPoSummary } from '../types';

interface PoSelectorProps {
  pendingPos: PendingPoSummary[];
  selectedPo: PendingPoSummary | null;
  onSelectPo: (po: PendingPoSummary) => void;
  isLoading?: boolean;
}

export const PoSelector: React.FC<PoSelectorProps> = ({
  pendingPos,
  selectedPo,
  onSelectPo,
  isLoading = false,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredPos = useMemo(() => {
    if (!searchKeyword.trim()) return pendingPos;
    const kw = searchKeyword.toLowerCase().trim();
    return pendingPos.filter(
      (po) =>
        po.poNumber.toLowerCase().includes(kw) ||
        po.supplierName.toLowerCase().includes(kw) ||
        po.supplierCode.toLowerCase().includes(kw)
    );
  }, [pendingPos, searchKeyword]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-12 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  if (pendingPos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">
          Không có Đơn mua hàng nào chờ nhận hàng
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Tất cả các Đơn mua hàng (PO) đã được tiếp nhận kho hoàn tất hoặc đã bị hủy.
          Khi bạn duyệt phương án mua hàng mới tại phân hệ DSS (UC-01), các đơn hàng Approved sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            Chọn Đơn Mua Hàng Cần Nhập Kho (PO Approved)
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mỗi Đơn mua hàng chỉ thực hiện nhận hàng 1 lần duy nhất để chốt tồn kho và tính OTIF (BR-11, BR-12)
          </p>
        </div>
        <Badge variant="primary" size="sm">
          {pendingPos.length} đơn chờ tiếp nhận
        </Badge>
      </div>

      {/* Selector Trigger Button / Search Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
            selectedPo
              ? 'bg-slate-50/70 border-emerald-500/80 ring-1 ring-emerald-500/20'
              : 'bg-white border-slate-300 hover:border-slate-400'
          }`}
        >
          {selectedPo ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedPo.poNumber}
                </span>
                <Badge variant="success" size="sm">
                  Approved
                </Badge>
                {selectedPo.isOverdue && (
                  <Badge variant="danger" size="sm">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Quá hạn {selectedPo.daysOverdue} ngày
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                  {selectedPo.supplierName}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({selectedPo.supplierCode})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hẹn giao:</span>
                <span className={`font-medium ${selectedPo.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                  {formatDate(selectedPo.expectedDeliveryDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedPo.totalLines} SKU</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(selectedPo.totalAmount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>-- Chọn một Đơn mua hàng Approved trong danh sách ({pendingPos.length} đơn) --</span>
            </div>
          )}

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              isDropdownOpen ? 'rotate-180 text-slate-700' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã PO hoặc tên nhà cung cấp..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredPos.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Không tìm thấy Đơn mua hàng nào khớp từ khóa "{searchKeyword}"
                </div>
              ) : (
                filteredPos.map((po) => {
                  const isSelected = selectedPo?.id === po.id;
                  return (
                    <div
                      key={po.id}
                      onClick={() => {
                        onSelectPo(po);
                        setIsDropdownOpen(false);
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                        isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {po.poNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {po.supplierName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {po.isOverdue && (
                            <Badge variant="danger" size="sm">
                              Trễ {po.daysOverdue} ngày
                            </Badge>
                          )}
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatCurrency(po.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                        <span>Ngày duyệt: {formatDate(po.approvalDate)}</span>
                        <span>•</span>
                        <span className={po.isOverdue ? 'text-rose-600 font-medium' : ''}>
                          Hạn giao: {formatDate(po.expectedDeliveryDate)}
                        </span>
                        <span>•</span>
                        <span>{po.totalLines} dòng SKU</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
