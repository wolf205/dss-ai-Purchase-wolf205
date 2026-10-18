import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';
import type { LoginFormValues } from '../types';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Lấy đường dẫn cần quay lại sau khi đăng nhập
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    '/dss';

  // Nếu đã đăng nhập thì tự động chuyển hướng
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await login(values);
      toast.success('Đăng nhập thành công', {
        description: 'Chào mừng bạn quay trở lại hệ thống DSS Purchase',
      });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      setServerError(errorMsg);
      toast.error('Đăng nhập thất bại', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 ring-1 ring-slate-800">
            <Store className="w-7 h-7 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          DSS Purchase System
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Hệ thống Hỗ trợ Ra Quyết định Mua hàng cho Cửa hàng Bán lẻ
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverError={serverError}
        />

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Phiên đăng nhập được bảo vệ bởi HttpOnly Cookie & In-Memory Token Isolation
        </p>
      </div>
    </div>
  );
};
