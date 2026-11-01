import React from 'react';
import { X, Target, BarChart2, TrendingUp } from 'lucide-react';
import type { SkuEvaluation } from '../types';
import { ForecastVsActualChart } from './ForecastVsActualChart';

interface SkuDetailModalProps {
  sku: SkuEvaluation | null;
  onClose: () => void;
}

export const SkuDetailModal: React.FC<SkuDetailModalProps> = ({ sku, onClose }) => {
  if (!sku) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {sku.skuCode}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-600">
                Nhóm {sku.abcXyzGroup}
              </span>
              <span className="text-xs text-slate-400">&bull; {sku.categoryName}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{sku.productName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Mini KPI Cards for this SKU */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-500" /> WAPE
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">{sku.wape.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-violet-500" /> MAPE
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">{sku.mape.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Bias
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {sku.bias > 0 ? `+${sku.bias.toFixed(1)}%` : `${sku.bias.toFixed(1)}%`}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 uppercase">Dự báo / Thực tế</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {sku.totalPredicted} / {sku.totalActual} <span className="text-xs font-normal text-slate-400">sp</span>
              </p>
            </div>
          </div>

          {/* Chart for this SKU */}
          <ForecastVsActualChart
            data={sku.dailyTimeline}
            title={`Diễn Biến Doanh Số: ${sku.productName}`}
            subtitle="Đường nét liền màu xanh lá là số bán thực tế; đường nét đứt màu xanh dương là dự báo DSS"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

