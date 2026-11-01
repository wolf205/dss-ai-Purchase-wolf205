import React, { useState } from 'react';
import { Search, LineChart } from 'lucide-react';
import type { SkuEvaluation } from '../types';
import { SkuDetailModal } from './SkuDetailModal';

interface SkuAccuracyTableProps {
  skuEvaluations: SkuEvaluation[];
}

export const SkuAccuracyTable: React.FC<SkuAccuracyTableProps> = ({ skuEvaluations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING'>('ALL');
  const [selectedSku, setSelectedSku] = useState<SkuEvaluation | null>(null);

  const filteredSkus = skuEvaluations.filter((sku) => {
    const matchesSearch =
      sku.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'ALL' || sku.qualityRating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const getQualityBadge = (rating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING') => {
    switch (rating) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Xuất Sắc
          </span>
        );
      case 'ACCEPTABLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Chấp Nhận Được
          </span>
        );
      case 'NEEDS_TUNING':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cần Hiệu Chỉnh
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Chi Tiết Sai Số Theo Từng Mặt Hàng (SKU)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng đối soát định lượng giữa số lượng dự báo và doanh số bán thực tế ({filteredSkus.length} SKU)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm SKU, tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setRatingFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ratingFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setRatingFilter('EXCELLENT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ratingFilter === 'EXCELLENT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Xuất sắc
            </button>
            <button
              onClick={() => setRatingFilter('ACCEPTABLE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ratingFilter === 'ACCEPTABLE' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Chấp nhận
            </button>
            <button
              onClick={() => setRatingFilter('NEEDS_TUNING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ratingFilter === 'NEEDS_TUNING' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cần chỉnh
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Sản Phẩm</th>
              <th className="py-3 px-4">Ngành Hàng / Nhóm</th>
              <th className="py-3 px-4 text-right">Dự Báo</th>
              <th className="py-3 px-4 text-right">Thực Tế</th>
              <th className="py-3 px-4 text-right">Sai Số WAPE</th>
              <th className="py-3 px-4 text-right">MAPE</th>
              <th className="py-3 px-4 text-right">Độ Lệch (Bias)</th>
              <th className="py-3 px-4 text-center">Xếp Hạng</th>
              <th className="py-3 px-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {filteredSkus.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              filteredSkus.map((sku) => (
                <tr key={sku.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{sku.productName}</p>
                    <span className="font-mono text-[10px] text-slate-400">{sku.skuCode}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-600 truncate max-w-[140px]">{sku.categoryName}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">
                      {sku.abcXyzGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    {sku.totalPredicted} <span className="text-slate-400 text-[10px]">sp</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-600">
                    {sku.totalActual} <span className="text-slate-400 text-[10px]">sp</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold ${
                        sku.wape <= 20 ? 'text-emerald-600' : sku.wape <= 35 ? 'text-amber-600' : 'text-rose-600'
                      }`}
                    >
                      {sku.wape.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">{sku.mape.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-medium ${
                        Math.abs(sku.bias) <= 5
                          ? 'text-emerald-600'
                          : sku.bias > 0
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {sku.bias > 0 ? `+${sku.bias.toFixed(1)}%` : `${sku.bias.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{getQualityBadge(sku.qualityRating)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedSku(sku)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Xem biểu đồ chi tiết từng ngày"
                    >
                      <LineChart className="w-3.5 h-3.5" /> Biểu đồ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sku Detail Modal */}
      <SkuDetailModal sku={selectedSku} onClose={() => setSelectedSku(null)} />
    </div>
  );
};
