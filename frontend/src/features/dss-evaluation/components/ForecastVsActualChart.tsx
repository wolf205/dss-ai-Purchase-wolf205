import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DailyEvaluationItem } from '../types';

interface ForecastVsActualChartProps {
  data: DailyEvaluationItem[];
  title?: string;
  subtitle?: string;
}

export const ForecastVsActualChart: React.FC<ForecastVsActualChartProps> = ({
  data,
  title = 'Biểu Đồ Đối Soát: Nhu Cầu Dự Báo vs Doanh Số Thực Tế Theo Ngày',
  subtitle = 'So sánh chuỗi dữ liệu dự báo được tính toán bởi thuật toán DSS với doanh số bán hàng thực tế đã ghi nhận',
}) => {
  const chartData = data.map((item) => {
    // Format YYYY-MM-DD to DD/MM
    const parts = item.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    return {
      date: formattedDate,
      fullDate: item.date,
      predicted: Math.round(item.predicted * 10) / 10,
      actual: item.actual,
      diff: Math.abs(Math.round((item.predicted - item.actual) * 10) / 10),
    };
  });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
                      <p className="font-semibold text-slate-200 mb-2">Ngày {item.fullDate}</p>
                      <div className="space-y-1">
                        <p className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>Thực tế bán:</span>
                          <span className="font-bold">{item.actual} sp</span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-blue-400">
                          <span>AI Dự báo:</span>
                          <span className="font-bold">{item.predicted} sp</span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-slate-400 border-t border-slate-800 pt-1 mt-1">
                          <span>Độ lệch:</span>
                          <span>&plusmn;{item.diff} sp</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Thực tế bán ra (Actual)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="AI Dự báo DSS (Forecast)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
