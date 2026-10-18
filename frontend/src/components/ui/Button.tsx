import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs border border-transparent focus:ring-slate-900',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 focus:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent focus:ring-rose-500',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs border border-transparent focus:ring-emerald-500',
  outline:
    'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 focus:ring-slate-400 shadow-2xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-transparent focus:ring-slate-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2.5 font-semibold',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
