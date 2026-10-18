import React from 'react';

export interface AbcXyzBadgeProps {
  badge: string; // e.g., 'AX', 'BY', 'CZ'
  abc?: string;
  xyz?: string;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  // Nhóm A: Doanh số cao (80% doanh thu)
  AX: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  AY: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  AZ: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },

  // Nhóm B: Doanh số trung bình (15% doanh thu)
  BX: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  BY: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  BZ: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },

  // Nhóm C: Doanh số thấp (5% doanh thu)
  CX: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CY: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CZ: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

const descriptions: Record<string, string> = {
  AX: 'Nhóm A-X: Doanh số cao (80%), nhu cầu rất ổn định (CV ≤ 0.5)',
  AY: 'Nhóm A-Y: Doanh số cao (80%), nhu cầu biến động vừa (0.5 < CV ≤ 1.0)',
  AZ: 'Nhóm A-Z: Doanh số cao (80%), nhu cầu biến động mạnh / ngắt quãng (CV > 1.0)',
  BX: 'Nhóm B-X: Doanh số trung bình (15%), nhu cầu ổn định',
  BY: 'Nhóm B-Y: Doanh số trung bình (15%), nhu cầu biến động vừa',
  BZ: 'Nhóm B-Z: Doanh số trung bình (15%), nhu cầu biến động mạnh',
  CX: 'Nhóm C-X: Doanh số thấp (5%), nhu cầu ổn định',
  CY: 'Nhóm C-Y: Doanh số thấp (5%), nhu cầu biến động vừa',
  CZ: 'Nhóm C-Z: Doanh số thấp (5%), nhu cầu biến động mạnh / SKU mới',
};

export const AbcXyzBadge: React.FC<AbcXyzBadgeProps> = ({
  badge,
  abc,
  xyz,
  size = 'md',
}) => {
  const code = (badge || `${abc || 'C'}${xyz || 'Z'}`).toUpperCase();
  const theme = colorMap[code] || colorMap['CZ'];
  const desc = descriptions[code] || `Nhóm ma trận ${code}`;

  const sizeClass =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px]'
      : 'px-2 py-0.5 text-xs';

  return (
    <span
      title={desc}
      className={`inline-flex items-center font-bold font-mono tracking-wider rounded border cursor-help transition-transform hover:scale-105 ${theme.bg} ${theme.text} ${theme.border} ${sizeClass}`}
    >
      {code}
    </span>
  );
};
