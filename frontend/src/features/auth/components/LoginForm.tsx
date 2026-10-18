import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { LoginFormValues, LoginFormErrors } from '../types';

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  isLoading: boolean;
  serverError?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  serverError,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {};
    if (!username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    }
    if (!password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ username: username.trim(), password });
  };

  const handleFillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrors({});
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200/90 rounded-2xl shadow-sm">
      {serverError && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Tên đăng nhập
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              placeholder="manager hoặc staff"
              className={`block w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none transition-colors ${
                errors.username
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800'
              }`}
            />
          </div>
          {errors.username && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.username}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Mật khẩu
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              className={`block w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none transition-colors ${
                errors.password
                  ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4 text-blue-400" />}
          className="w-full mt-2"
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
        </Button>
      </form>

      {/* Quick Demo Credentials Box */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Tài khoản mẫu thử nghiệm
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleFillCredentials('manager', 'password123')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-tight">Quản lý</p>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">manager</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleFillCredentials('staff', 'password123')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-tight">Nhân viên</p>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">staff</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
