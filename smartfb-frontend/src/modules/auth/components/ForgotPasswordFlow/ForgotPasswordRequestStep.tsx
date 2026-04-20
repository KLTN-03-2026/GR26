import type { UseFormReturn } from 'react-hook-form';
import { Mail } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { cn } from '@shared/utils/cn';
import { EMAIL_PATTERN, type ForgotPasswordRequestFormValues } from '@modules/auth/hooks/useForgotPasswordFlow';

interface ForgotPasswordRequestStepProps {
  form: UseFormReturn<ForgotPasswordRequestFormValues>;
  isPending: boolean;
  onSubmit: (values: ForgotPasswordRequestFormValues) => Promise<void>;
}

/**
 * Bước nhập email để bắt đầu flow khôi phục mật khẩu.
 */
export const ForgotPasswordRequestStep = ({
  form,
  isPending,
  onSubmit,
}: ForgotPasswordRequestStepProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recovery-email" className="text-sm font-semibold text-text-primary">
          Email đã đăng ký
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <Input
            id="recovery-email"
            type="email"
            placeholder="name@example.com"
            className={cn(
              'h-12 border-border pl-11 focus:border-primary',
              form.formState.touchedFields.email &&
                form.formState.errors.email &&
                'border-red-500 focus:border-red-500'
            )}
            {...form.register('email', {
              required: 'Email không được để trống',
              pattern: {
                value: EMAIL_PATTERN,
                message: 'Email không hợp lệ',
              },
            })}
          />
        </div>
        {form.formState.touchedFields.email && form.formState.errors.email ? (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="rounded-card border border-dashed border-primary-light bg-primary-light px-4 py-4 text-sm leading-6 text-text-secondary">
        Hệ thống sẽ gửi mã OTP 6 số đến email của bạn. Sau khi xác thực OTP, bạn sẽ được phép tạo mật khẩu mới.
      </div>

      <Button
        type="submit"
        className="h-12 w-full bg-primary text-base font-semibold text-white shadow-card hover:bg-primary-hover"
        disabled={isPending}
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <div className="spinner spinner-sm" />
            Đang gửi mã OTP...
          </div>
        ) : (
          'Gửi mã OTP'
        )}
      </Button>
    </form>
  );
};
