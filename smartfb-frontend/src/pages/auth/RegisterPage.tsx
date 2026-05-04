import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { PageMeta } from '@shared/components/common/PageMeta';
import { BrandLogo } from '@shared/components/layout/BrandLogo';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useRegister } from '@modules/auth/hooks/useRegister';
import { cn } from '@shared/utils/cn';
import { ROUTES } from '@shared/constants/routes';

/**
 * Form payload cho đăng ký tenant
 */
interface RegisterFormValues {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  planSlug: string;
}

/**
 * Trang đăng ký tài khoản mới SmartF&B
 * UI: Nền trắng, form ở giữa có shadow nhẹ
 */
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: register, isPending } = useRegister();

  const {
    register: registerForm,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      planSlug: 'trial',
    },
  });

  const password = useWatch({
    control,
    name: 'password',
  });

  const onSubmit = (data: RegisterFormValues) => {
    register({
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      planSlug: data.planSlug,
    });
  };

  return (
    <>
      <PageMeta
        title="Đăng ký"
        description="Đăng ký SmartF&B để tạo tài khoản quản lý chuỗi quán, chi nhánh, thực đơn và vận hành F&B tập trung."
        noIndex
      />
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <div className="w-full max-w-2xl">
          {/* Logo + Title */}
          <div className="mb-8 text-center">
            <h1 className="sr-only">Đăng ký SmartF&amp;B</h1>
            <BrandLogo
              className="justify-center mb-4 gap-3"
              iconClassName="h-16 w-16 drop-shadow-lg"
              textClassName="text-4xl text-text-primary"
            />
            <p className="text-text-secondary">Tạo tài khoản quản lý chuỗi quán của bạn</p>
          </div>

          {/* Register Form */}
          <div className="rounded-card border border-border bg-card p-8 shadow-card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Thông tin chủ quán */}
              <div className="space-y-4">
                <h3 className="border-b border-border pb-2 text-lg font-semibold text-text-primary">
                  Thông tin chủ quán
                </h3>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-sm font-semibold text-text-primary">
                  Tên chủ quán <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Nhập tên của bạn"
                    className={cn(
                      'h-12 border-border pl-11 focus:border-primary',
                      touchedFields.ownerName && errors.ownerName && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('ownerName', {
                      required: 'Tên chủ quán không được để trống',
                      minLength: {
                        value: 2,
                        message: 'Tên phải có ít nhất 2 ký tự',
                      },
                    })}
                  />
                </div>
                {touchedFields.ownerName && errors.ownerName && (
                  <p className="text-sm text-red-600">{errors.ownerName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-text-primary">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09xxxxxxxx"
                    className={cn(
                      'h-12 border-border pl-11 focus:border-primary',
                      touchedFields.phone && errors.phone && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('phone', {
                      pattern: {
                        value: /^0\d{9}$/,
                        message: 'Số điện thoại không hợp lệ',
                      },
                    })}
                  />
                </div>
                {touchedFields.phone && errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Account Info Section */}
            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-lg font-semibold text-text-primary">
                Thông tin tài khoản
              </h3>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-text-primary">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={cn(
                      'h-12 border-border pl-11 focus:border-primary',
                      touchedFields.email && errors.email && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('email', {
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-text-primary">
                  Mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 8 ký tự"
                    className={cn(
                      'h-12 border-border pl-11 pr-11 focus:border-primary',
                      touchedFields.password && errors.password && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('password', {
                      required: 'Mật khẩu không được để trống',
                      minLength: {
                        value: 8,
                        message: 'Mật khẩu phải có ít nhất 8 ký tự',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touchedFields.password && errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-text-primary">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    className={cn(
                      'h-12 border-border pl-11 pr-11 focus:border-primary',
                      touchedFields.confirmPassword && errors.confirmPassword && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('confirmPassword', {
                      required: 'Xác nhận mật khẩu không được để trống',
                      validate: (value) => value === password || 'Mật khẩu xác nhận không khớp',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touchedFields.confirmPassword && errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label htmlFor="planSlug" className="text-sm font-semibold text-text-primary">
                  Gói dịch vụ
                </Label>
                <select
                  id="planSlug"
                  className="h-12 w-full rounded-md border border-border bg-card px-4 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  {...registerForm('planSlug')}
                >
                  <option value="trial">Dùng thử 7 ngày (Trial)</option>
                  <option value="basic">Cơ bản (Basic)</option>
                  <option value="standard">Tiêu chuẩn (Standard)</option>
                  <option value="premium">Nâng cao (Premium)</option>
                </select>
                <p className="text-xs text-text-secondary">Bạn có thể nâng cấp gói dịch vụ sau này</p>
              </div>
            </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="h-12 w-full bg-primary text-base font-semibold text-white shadow-card transition-all duration-200 hover:bg-primary-hover"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner spinner-sm" />
                    Đang đăng ký...
                  </div>
                ) : (
                  'Đăng ký ngay'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-text-secondary">Hoặc</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Đã có tài khoản?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-text-secondary">
            © 2026 SmartF&B. Nền tảng quản lý chuỗi F&B
          </p>
        </div>
      </div>
    </>
  );
}
