import type { UseFormReturn } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { cn } from '@shared/utils/cn';
import type { ResetPasswordFormValues } from '@modules/auth/hooks/useForgotPasswordFlow';

interface ForgotPasswordResetStepProps {
  form: UseFormReturn<ResetPasswordFormValues>;
  isPending: boolean;
  newPassword: string;
  showConfirmPassword: boolean;
  showNewPassword: boolean;
  verificationMessage: string;
  onBackToEmailStep: () => void;
  onSubmit: (values: ResetPasswordFormValues) => Promise<void>;
  onToggleConfirmPasswordVisibility: () => void;
  onToggleNewPasswordVisibility: () => void;
}

/**
 * Bước đặt lại mật khẩu sau khi OTP đã được xác thực thành công.
 */
export const ForgotPasswordResetStep = ({
  form,
  isPending,
  newPassword,
  showConfirmPassword,
  showNewPassword,
  verificationMessage,
  onBackToEmailStep,
  onSubmit,
  onToggleConfirmPasswordVisibility,
  onToggleNewPasswordVisibility,
}: ForgotPasswordResetStepProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-card border border-success-light bg-success-light px-4 py-4 text-sm leading-6 text-success-text">
        {verificationMessage || 'OTP hợp lệ. Vui lòng tạo mật khẩu mới để hoàn tất.'}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-sm font-semibold text-text-primary">
          Mật khẩu mới
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Ít nhất 8 ký tự"
            className={cn(
              'h-12 border-border pl-11 pr-11 focus:border-primary',
              form.formState.touchedFields.newPassword &&
                form.formState.errors.newPassword &&
                'border-red-500 focus:border-red-500'
            )}
            {...form.register('newPassword', {
              required: 'Mật khẩu mới không được để trống',
              minLength: {
                value: 8,
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
              },
            })}
          />
          <button
            type="button"
            onClick={onToggleNewPasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {form.formState.touchedFields.newPassword && form.formState.errors.newPassword ? (
          <p className="text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-sm font-semibold text-text-primary">
          Xác nhận mật khẩu mới
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            className={cn(
              'h-12 border-border pl-11 pr-11 focus:border-primary',
              form.formState.touchedFields.confirmPassword &&
                form.formState.errors.confirmPassword &&
                'border-red-500 focus:border-red-500'
            )}
            {...form.register('confirmPassword', {
              required: 'Vui lòng xác nhận mật khẩu mới',
              validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp',
            })}
          />
          <button
            type="button"
            onClick={onToggleConfirmPasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {form.formState.touchedFields.confirmPassword && form.formState.errors.confirmPassword ? (
          <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 border-border text-text-secondary hover:bg-hover-light hover:text-text-primary"
          onClick={onBackToEmailStep}
          disabled={isPending}
        >
          Nhập lại email
        </Button>
        <Button
          type="submit"
          className="h-12 flex-1 bg-primary text-base font-semibold text-white shadow-card hover:bg-primary-hover"
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="spinner spinner-sm" />
              Đang cập nhật...
            </div>
          ) : (
            'Lưu mật khẩu mới'
          )}
        </Button>
      </div>
    </form>
  );
};
