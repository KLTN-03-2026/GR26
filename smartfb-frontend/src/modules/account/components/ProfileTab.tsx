import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Mail, Phone, RefreshCcw, Shield, User } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { useMyProfile } from '@modules/account/hooks/useMyProfile';
import { useUpdateProfile } from '@modules/account/hooks/useUpdateProfile';

const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  phone: z
    .string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)')
    .or(z.literal(''))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Tab hiển thị và chỉnh sửa thông tin cá nhân.
 * Email là read-only — không thể thay đổi ở đây.
 */
export const ProfileTab = () => {
  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  // Điền dữ liệu vào form khi profile load xong
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        phone: profile.phone ?? '',
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile({
      fullName: values.fullName,
      phone: values.phone || undefined,
    });
  };

  const handleRetry = () => {
    void refetch();
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-card border border-border bg-muted/20 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="mt-3 text-base font-semibold text-text-primary">
          Không thể tải thông tin cá nhân
        </h3>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          Vui lòng kiểm tra phiên đăng nhập hoặc trạng thái kết nối rồi thử tải lại.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isFetching}
          onClick={handleRetry}
        >
          <RefreshCcw className="h-4 w-4" />
          {isFetching ? 'Đang tải lại...' : 'Tải lại'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-text-primary">{profile.fullName}</p>
          <p className="text-sm text-text-secondary">{profile.email}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Họ tên */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Họ và tên
                </FormLabel>
                <FormControl>
                  <Input placeholder="Nguyễn Văn A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email — read-only */}
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
              <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-text-secondary">
                Không thể thay đổi
              </span>
            </FormLabel>
            <Input value={profile.email} disabled className="bg-muted/50 cursor-not-allowed" />
          </FormItem>

          {/* Số điện thoại */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Số điện thoại
                  <span className="ml-1 text-xs text-text-secondary">(tuỳ chọn)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="0901234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Trạng thái tài khoản — read-only info */}
          <div className="rounded-card border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Shield className="h-4 w-4" />
              <span>
                Trạng thái tài khoản:{' '}
                <span className="font-medium text-success-text">
                  {profile.status === 'ACTIVE' ? 'Đang hoạt động' : profile.status}
                </span>
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
