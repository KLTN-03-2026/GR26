import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useLogin } from '@modules/auth/hooks/useLogin';
import type { LoginCredentials } from '@modules/auth/types/auth.types';
import { cn } from '@shared/utils/cn';
import { ROUTES } from '@shared/constants/routes';

/**
 * Trang đăng nhập SmartF&B
 * UI: Nền trắng, form ở giữa có shadow nhẹ
 */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#e8692a] rounded-2xl flex items-center justify-center shadow-xl">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">SmartF&B</h1>
          <p className="text-[#7a7a7a]">Đăng nhập để quản lý chuỗi quán của bạn</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebe3] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-[#1a1a1a]">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[#e8692a]" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={cn(
                    'pl-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
                    touchedFields.email && errors.email && 'border-red-500 focus:border-red-500'
                  )}
                  {...register('email', {
                    required: 'Email không được để trống',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                />
              </div>
              {touchedFields.email && errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#1a1a1a]">
                Mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#e8692a]" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  className={cn(
                    'pl-11 pr-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
                    touchedFields.password && errors.password && 'border-red-500 focus:border-red-500'
                  )}
                  {...register('password', {
                    required: 'Mật khẩu không được để trống',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#e8692a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touchedFields.password && errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#e8692a] hover:text-[#d1551f] font-medium transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#e8692a] hover:bg-[#d1551f] text-white font-semibold text-base shadow-lg transition-all duration-200"
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="spinner spinner-sm" />
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f0ebe3]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#7a7a7a]">Hoặc</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-[#7a7a7a]">
              Chưa có tài khoản?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="text-[#e8692a] hover:text-[#d1551f] font-semibold transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#7a7a7a] mt-8">
          © 2026 SmartF&B. Nền tảng quản lý chuỗi F&B
        </p>
      </div>
    </div>
  );
}
