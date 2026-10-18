import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AbcXyzBadge } from './AbcXyzBadge';
import { StockRiskBadge } from './StockRiskBadge';
import type { RecommendationItem } from '../types';
import { TrendingUp, Calendar, Info } from 'lucide-react';

export interface ForecastChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: RecommendationItem | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | [number, number];
    color: string;
    payload: {
      date: string;
      fullDate: string;
      predicted: number;
      lower: number;
      upper: number;
    };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
        <p className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          {data.fullDate || data.date}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-amber-400 font-medium">Nhu cầu dự báo:</span>
          <span className="font-bold text-white text-sm">
            {Number(data.predicted).toFixed(1)} đơn vị
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <span>Khoảng tin cậy (CI 95%):</span>
          <span className="font-mono text-blue-300">
            [{Number(data.lower).toFixed(1)} – {Number(data.upper).toFixed(1)}]
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastChartModal: React.FC<ForecastChartModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!item) return null;

  const chartData = (item.dailyForecasts || []).map((f) => ({
    date: f.date ? f.date.substring(5) : '', // e.g. "10-05"
    fullDate: f.date,
    predicted: Number(f.predicted),
    lower: Number(f.lower),
    upper: Number(f.upper),
    ciBand: [Number(f.lower), Number(f.upper)],
  }));

  const totalForecast14Days = chartData.reduce(
    (sum, d) => sum + (d.predicted || 0),
    0
  );
  const avgDailyDemand =
    chartData.length > 0 ? totalForecast14Days / chartData.length : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Biểu Đồ Dự Báo Nhu Cầu 14 Ngày</span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium text-slate-700">{item.skuName}</span>
          <span className="text-slate-400 font-mono">({item.skuCode})</span>
          <AbcXyzBadge badge={item.abcXyzBadge} size="sm" />
          <StockRiskBadge status={item.stockRiskStatus} size="sm" />
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Metric summary banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tổng dự báo (14 ngày)
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {totalForecast14Days.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">sp</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Trung bình ngày (d̄)
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {avgDailyDemand.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">sp/ngày</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tồn an toàn (SS)
            </p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">
              {item.safetyStock}{' '}
              <span className="text-xs font-normal text-slate-500">sp</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Điểm đặt hàng (ROP)
            </p>
            <p className="text-lg font-bold text-amber-600 mt-0.5">
              {item.reorderPoint}{' '}
              <span className="text-xs font-normal text-slate-500">sp</span>
            </p>
          </div>
        </div>

        {/* Recharts Area */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Đường dự báo và khoảng tin cậy CI 95%
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              Độ dài chuỗi: {chartData.length} ngày
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu dự báo cho mặt hàng này.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '12px' }}
                  />

                  {/* Dải tin cậy CI 95% */}
                  <Area
                    type="monotone"
                    dataKey="ciBand"
                    fill="#3b82f6"
                    fillOpacity={0.12}
                    stroke="#93c5fd"
                    strokeWidth={1}
                    name="Dải tin cậy CI 95%"
                  />

                  {/* Đường dự báo chính */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    activeDot={{ r: 5 }}
                    name="Dự báo nhu cầu"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Explain footer */}
        <p className="text-[11px] text-slate-400 italic">
          * Dải tin cậy CI 95% phản ánh biên độ dao động nhu cầu thực tế tiềm năng. Nếu chuỗi bán quá khứ có độ biến động cao (Z), dải tin cậy sẽ mở rộng hơn.
        </p>
      </div>
    </Modal>
  );
};
