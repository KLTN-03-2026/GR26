import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { useChangePassword } from '../hooks/useChangePassword';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu mới phải chứa ít nhất 1 chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface PasswordFieldProps {
  show: boolean;
  onToggle: () => void;
}

const PasswordToggleButton = ({ show, onToggle }: PasswordFieldProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
    tabIndex={-1}
  >
    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
);

/**
 * Tab đổi mật khẩu tài khoản cá nhân.
 * Yêu cầu nhập mật khẩu hiện tại để xác thực danh tính trước khi đổi.
 */
export const ChangePasswordTab = () => {
  const { mutate: changePassword, isPending } = useChangePassword();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          // Reset form sau khi đổi thành công
          form.reset();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-card border border-border bg-muted/30 p-4">
        <KeyRound className="h-5 w-5 shrink-0 text-text-secondary" />
        <p className="text-sm text-text-secondary">
          Mật khẩu mới phải có ít nhất <strong>8 ký tự</strong>, chứa ít nhất{' '}
          <strong>1 chữ hoa</strong> và <strong>1 chữ số</strong>.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Mật khẩu hiện tại */}
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu hiện tại</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      {...field}
                    />
                    <PasswordToggleButton
                      show={showCurrent}
                      onToggle={() => setShowCurrent((v) => !v)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mật khẩu mới */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu mới</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu mới"
                      {...field}
                    />
                    <PasswordToggleButton
                      show={showNew}
                      onToggle={() => setShowNew((v) => !v)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Xác nhận mật khẩu mới */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      {...field}
                    />
                    <PasswordToggleButton
                      show={showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
