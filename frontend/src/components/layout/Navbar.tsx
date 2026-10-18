import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Menu, LogOut, ShieldCheck, User as UserIcon, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dss': {
    title: 'Bảng Đề Xuất DSS',
    subtitle: 'Khuyến nghị mua hàng thông minh & Phân loại ABC-XYZ',
  },
  '/orders': {
    title: 'Quản Lý Đơn Mua Hàng',
    subtitle: 'Theo dõi tiến độ đơn hàng và lịch giao nhà cung cấp',
  },
  '/receipts': {
    title: 'Nhập Kho & Đánh Giá OTIF',
    subtitle: 'Ghi nhận nhận hàng thực tế và cập nhật điểm tín nhiệm NCC',
  },
  '/data-import': {
    title: 'Nhập Dữ Liệu Lịch Sử',
    subtitle: 'Import dữ liệu bán hàng và kiểm kê tồn kho theo lô',
  },
  '/catalog': {
    title: 'Danh Mục Hàng Hóa',
    subtitle: 'Quản lý thông tin SKU, đơn vị tính và ngành hàng',
  },
  '/suppliers': {
    title: 'Quản Lý Nhà Cung Cấp',
    subtitle: 'Hồ sơ đối tác, điều kiện MOQ và đơn giá cung ứng',
  },
  '/configuration': {
    title: 'Cấu Hình Tham Số Hệ Thống',
    subtitle: 'Thiết lập trọng số WSM, Service Level và chu kỳ đánh giá',
  },
  '/unauthorized': {
    title: 'Từ Chối Truy Cập',
    subtitle: 'Quyền hạn tài khoản không đáp ứng yêu cầu',
  },
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const routeInfo = routeTitles[location.pathname] || {
    title: 'Hệ Thống DSS',
    subtitle: 'Decision Support System',
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Bạn đã đăng xuất khỏi hệ thống');
      navigate('/login');
    } catch {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'STORE_MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-white">
          <ShieldCheck className="w-3 h-3 text-blue-400" />
          Quản Lý Cửa Hàng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
        <UserIcon className="w-3 h-3 text-slate-500" />
        Nhân Viên Mua Hàng
      </span>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight leading-none">
            {routeInfo.title}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block mt-1 leading-none">
            {routeInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: System status & User Profile */}
      <div className="flex items-center gap-4">
        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold tracking-wider">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-slate-800 leading-none">
                {user?.fullName || user?.username || 'Người dùng'}
              </p>
              <div className="mt-1 leading-none">{getRoleBadge(user?.role)}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-toast-enter">
              <div className="px-3.5 py-2 border-b border-slate-100 md:hidden">
                <p className="text-xs font-semibold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400">@{user?.username}</p>
                <div className="mt-1.5">{getRoleBadge(user?.role)}</div>
              </div>

              <div className="px-3.5 py-2 text-[11px] text-slate-500 hidden md:block">
                Tài khoản: <span className="font-semibold text-slate-700">@{user?.username}</span>
              </div>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất khỏi hệ thống
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
