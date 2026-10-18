import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { ProductStatus } from '../types';

interface ProductStatusBadgeProps {
  status: ProductStatus | string;
  size?: 'sm' | 'md';
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isActive = status === 'Active';

  return (
    <Badge
      variant={isActive ? 'success' : 'neutral'}
      size={size}
      dot
      className={
        isActive
          ? 'font-medium bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'font-medium bg-slate-100 text-slate-600 border-slate-200'
      }
    >
      {isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
    </Badge>
  );
};
