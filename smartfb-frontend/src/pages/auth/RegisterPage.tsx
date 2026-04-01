import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, Store, Eye, EyeOff } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useRegister } from '@modules/auth/hooks/useRegister';
import { cn } from '@shared/utils/cn';

/**
 * Form payload cho đăng ký tenant
 */
interface RegisterFormValues {
  tenantName: string;
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
    formState: { errors, touchedFields },
    watch,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      tenantName: '',
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      planSlug: 'free',
    },
  });

  const password = watch('password');

  const onSubmit = (data: RegisterFormValues) => {
    register({
      tenantName: data.tenantName,
      ownerName: data.ownerName,
      email: data.email,
      password: data.password,
      planSlug: data.planSlug,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#e8692a] rounded-2xl flex items-center justify-center shadow-xl">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Đăng ký SmartF&B</h1>
          <p className="text-[#7a7a7a]">Tạo tài khoản quản lý chuỗi quán của bạn</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebe3] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Business Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1a1a1a] border-b border-[#f0ebe3] pb-2">
                Thông tin doanh nghiệp
              </h3>

              {/* Tenant Name */}
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="text-sm font-semibold text-[#1a1a1a]">
                  Tên quán / doanh nghiệp <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Store className="w-5 h-5 text-[#e8692a]" />
                  </div>
                  <Input
                    id="tenantName"
                    type="text"
                    placeholder="VD: Coffee House, Restaurant ABC..."
                    className={cn(
                      'pl-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
                      touchedFields.tenantName && errors.tenantName && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('tenantName', {
                      required: 'Tên doanh nghiệp không được để trống',
                      minLength: {
                        value: 3,
                        message: 'Tên doanh nghiệp phải có ít nhất 3 ký tự',
                      },
                    })}
                  />
                </div>
                {touchedFields.tenantName && errors.tenantName && (
                  <p className="text-sm text-red-600">{errors.tenantName.message}</p>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-sm font-semibold text-[#1a1a1a]">
                  Tên chủ quán <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-[#e8692a]" />
                  </div>
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Nhập tên của bạn"
                    className={cn(
                      'pl-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
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
                <Label htmlFor="phone" className="text-sm font-semibold text-[#1a1a1a]">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-[#e8692a]" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09xxxxxxxx"
                    className={cn(
                      'pl-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
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
              <h3 className="text-lg font-semibold text-[#1a1a1a] border-b border-[#f0ebe3] pb-2">
                Thông tin tài khoản
              </h3>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#1a1a1a]">
                  Email <span className="text-red-500">*</span>
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
                <Label htmlFor="password" className="text-sm font-semibold text-[#1a1a1a]">
                  Mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#e8692a]" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    className={cn(
                      'pl-11 pr-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
                      touchedFields.password && errors.password && 'border-red-500 focus:border-red-500'
                    )}
                    {...registerForm('password', {
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1a1a1a]">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#e8692a]" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    className={cn(
                      'pl-11 pr-11 h-12 border-[#f0ebe3] focus:border-[#e8692a]',
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#e8692a] transition-colors"
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
                <Label htmlFor="planSlug" className="text-sm font-semibold text-[#1a1a1a]">
                  Gói dịch vụ
                </Label>
                <select
                  id="planSlug"
                  className="w-full h-12 px-4 border border-[#f0ebe3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8692a] focus:border-transparent"
                  {...registerForm('planSlug')}
                >
                  <option value="free">Miễn phí (Free)</option>
                  <option value="starter">Khởi đầu (Starter)</option>
                  <option value="pro">Chuyên nghiệp (Pro)</option>
                  <option value="enterprise">Doanh nghiệp (Enterprise)</option>
                </select>
                <p className="text-xs text-[#7a7a7a]">Bạn có thể nâng cấp gói dịch vụ sau này</p>
              </div>
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
              <div className="w-full border-t border-[#f0ebe3]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#7a7a7a]">Hoặc</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-[#7a7a7a]">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-[#e8692a] hover:text-[#d1551f] font-semibold transition-colors"
              >
                Đăng nhập ngay
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
