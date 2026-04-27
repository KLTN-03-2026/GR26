import { useState } from 'react';
import { Eye, EyeOff, Settings2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { usePermission } from '@shared/hooks/usePermission';
import { usePaymentConfig } from '../../hooks/usePaymentConfig';
import { useSavePaymentConfig } from '../../hooks/useSavePaymentConfig';

interface PaymentConfigCardProps {
  branchId: string;
}

const paymentConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID không được để trống'),
  apiKey: z.string().min(1, 'API Key không được để trống'),
  checksumKey: z.string().min(1, 'Checksum Key không được để trống'),
});

type PaymentConfigFormValues = z.infer<typeof paymentConfigSchema>;

/**
 * Card cấu hình cổng thanh toán PayOS cho chi nhánh.
 * Chỉ hiển thị với Owner (có quyền BRANCH_EDIT).
 * Form chỉ mở khi bấm "Chỉnh sửa" — tránh lộ key khi chụp màn hình.
 */
export const PaymentConfigCard = ({ branchId }: PaymentConfigCardProps) => {
  const { isOwner } = usePermission();
  const { data: config, isLoading } = usePaymentConfig(branchId);
  const { mutate: saveConfig, isPending } = useSavePaymentConfig(branchId);

  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksumKey, setShowChecksumKey] = useState(false);

  const form = useForm<PaymentConfigFormValues>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: { clientId: '', apiKey: '', checksumKey: '' },
  });

  // Chỉ Owner mới được thấy section này
  if (!isOwner) return null;

  const onSubmit = (values: PaymentConfigFormValues) => {
    saveConfig(values, {
      onSuccess: () => {
        setIsEditing(false);
        form.reset();
      },
    });
  };

  const handleStartEdit = () => {
    // Điền sẵn clientId (không nhạy cảm) để Owner không phải nhập lại
    form.reset({
      clientId: config?.clientId ?? '',
      apiKey: '',
      checksumKey: '',
    });
    setIsEditing(true);
    setShowApiKey(false);
    setShowChecksumKey(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Settings2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Cổng thanh toán PayOS</h3>
            <p className="text-sm text-slate-500">Cấu hình từ dashboard.payos.vn</p>
          </div>
        </div>

        {/* Badge trạng thái kết nối */}
        {!isLoading && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              config?.isConfigured
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {config?.isConfigured ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-16 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : !isEditing ? (
        /* Chế độ xem — masked keys */
        <div className="space-y-3">
          {config?.isConfigured ? (
            <>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-0.5 text-xs font-medium text-slate-500">Client ID</p>
                <p className="font-mono text-sm text-slate-800">{config.clientId}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-0.5 text-xs font-medium text-slate-500">API Key</p>
                <p className="font-mono text-sm text-slate-800">{config.apiKeyMasked}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-0.5 text-xs font-medium text-slate-500">Checksum Key</p>
                <p className="font-mono text-sm text-slate-800">{config.checksumKeyMasked}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có cấu hình. Nhấn "Cấu hình" để nhập thông tin PayOS cho chi nhánh này.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 rounded-xl"
            onClick={handleStartEdit}
          >
            {config?.isConfigured ? 'Chỉnh sửa' : 'Cấu hình'}
          </Button>
        </div>
      ) : (
        /* Chế độ chỉnh sửa — form nhập key */
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Client ID */}
          <div className="space-y-1.5">
            <Label htmlFor="payos-client-id" className="text-sm font-medium text-slate-700">
              Client ID
            </Label>
            <Input
              id="payos-client-id"
              {...form.register('clientId')}
              placeholder="Nhập Client ID từ PayOS..."
              className="rounded-xl"
              autoComplete="off"
            />
            {form.formState.errors.clientId && (
              <p className="text-xs text-red-500">{form.formState.errors.clientId.message}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="payos-api-key" className="text-sm font-medium text-slate-700">
              API Key
            </Label>
            <div className="relative">
              <Input
                id="payos-api-key"
                {...form.register('apiKey')}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Nhập API Key từ PayOS..."
                className="rounded-xl pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.apiKey && (
              <p className="text-xs text-red-500">{form.formState.errors.apiKey.message}</p>
            )}
          </div>

          {/* Checksum Key */}
          <div className="space-y-1.5">
            <Label htmlFor="payos-checksum-key" className="text-sm font-medium text-slate-700">
              Checksum Key
            </Label>
            <div className="relative">
              <Input
                id="payos-checksum-key"
                {...form.register('checksumKey')}
                type={showChecksumKey ? 'text' : 'password'}
                placeholder="Nhập Checksum Key từ PayOS..."
                className="rounded-xl pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowChecksumKey((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showChecksumKey ? 'Ẩn Checksum Key' : 'Hiện Checksum Key'}
              >
                {showChecksumKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.checksumKey && (
              <p className="text-xs text-red-500">{form.formState.errors.checksumKey.message}</p>
            )}
          </div>

          {/* Ghi chú bảo mật */}
          <p className="text-xs text-slate-400">
            Thông tin được mã hóa trước khi lưu. Hệ thống không lưu plaintext key.
          </p>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={isPending}
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleCancelEdit}
              disabled={isPending}
            >
              Hủy
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
