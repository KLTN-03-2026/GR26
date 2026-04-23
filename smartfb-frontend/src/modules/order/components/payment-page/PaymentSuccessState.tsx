import { CheckCircle2, ReceiptText, XCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';

type PaymentResultStatus = 'success' | 'error';

interface PaymentSuccessStateProps {
  status?: PaymentResultStatus;
  title?: string;
  description?: string;
  onPrint?: () => void;
  onCreateNewOrder?: () => void;
}

export const PaymentSuccessState = ({
  status = 'success',
  title,
  description,
  onPrint,
  onCreateNewOrder,
}: PaymentSuccessStateProps) => {
  const isSuccess = status === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
      <div className="max-w-lg text-center">
        <div
          className={cn(
            'mx-auto flex h-24 w-24 items-center justify-center rounded-full',
            isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
          )}
        >
          <Icon className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900">
          {title ?? (isSuccess ? 'Thanh toán hoàn tất' : 'Thanh toán thất bại')}
        </h1>
        <p className="mt-3 text-slate-500">
          {description ??
            (isSuccess
              ? 'Đơn hàng đã hoàn tất ở quầy. Bạn có thể quay lại để tạo đơn mới cho bàn tiếp theo.'
              : 'Giao dịch chưa hoàn tất. Hệ thống sẽ quay về khu vực bàn để bạn kiểm tra lại.')}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-400">
          Hệ thống sẽ tự quay về khu vực bàn sau 2 giây.
        </p>

        {(onPrint || onCreateNewOrder) && (
          <div className="mt-8 flex justify-center gap-3">
            {isSuccess && onPrint && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={onPrint}
              >
                <ReceiptText className="mr-2 h-4 w-4" />
                In hóa đơn
              </Button>
            )}
            {onCreateNewOrder && (
              <Button
                type="button"
                onClick={onCreateNewOrder}
                className="rounded-full bg-orange-500 hover:bg-orange-600"
              >
                Về khu vực bàn
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
