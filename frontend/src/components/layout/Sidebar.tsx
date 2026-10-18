import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';
import {
  TrendingUp,
  ClipboardList,
  PackageCheck,
  Database,
  Boxes,
  Building2,
  Sliders,
  Store,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  allowedRoles?: UserRole[];
}

const navItems: NavItemConfig[] = [
  {
    name: 'Bảng Đề Xuất DSS',
    path: '/dss',
    icon: TrendingUp,
    description: 'Dự báo & Phê duyệt mua hàng (UC-01)',
  },
  {
    name: 'Đơn Mua Hàng',
    path: '/orders',
    icon: ClipboardList,
    description: 'Theo dõi & Quản lý đơn PO (UC-02)',
  },
  {
    name: 'Nhập Kho',
    path: '/receipts',
    icon: PackageCheck,
    description: 'Nhận hàng & Đánh giá OTIF (UC-03)',
  },
  {
    name: 'Nhập Dữ Liệu',
    path: '/data-import',
    icon: Database,
    description: 'Import bán hàng & tồn kho (UC-04)',
  },
  {
    name: 'Danh Mục Hàng Hóa',
    path: '/catalog',
    icon: Boxes,
    description: 'Quản lý SKU & Ngành hàng (UC-05)',
  },
  {
    name: 'Nhà Cung Cấp',
    path: '/suppliers',
    icon: Building2,
    description: 'Hồ sơ NCC & Điều kiện cung ứng (UC-06)',
  },
  {
    name: 'Cấu Hình Tham Số',
    path: '/configuration',
    icon: Sliders,
    description: 'Trọng số WSM & Service Level (UC-07)',
    allowedRoles: ['STORE_MANAGER', 'PURCHASING_STAFF'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Lọc menu theo role của user
  const visibleNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return user ? item.allowedRoles.includes(user.role) : false;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                DSS Purchase
              </h1>
              <p className="text-[11px] text-slate-400 mt-1 font-medium leading-none">
                Decision Support System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Quy trình nghiệp vụ
            </span>
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <div className="flex-1 truncate">
                      <span className="block truncate">{item.name}</span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System & Store Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Single Store Retail DSS</span>
            <span className="font-mono text-[10px] text-slate-400">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
