import { CheckCircle2, ReceiptText } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface PaymentSuccessStateProps {
  onPrint: () => void;
  onCreateNewOrder: () => void;
}

export const PaymentSuccessState = ({
  onPrint,
  onCreateNewOrder,
}: PaymentSuccessStateProps) => {
  return (
    <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900">
          Thanh toán hoàn tất
        </h1>
        <p className="mt-3 text-slate-500">
          Đơn hàng đã hoàn tất ở quầy. Bạn có thể quay lại để tạo đơn mới cho bàn tiếp theo.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-400">
          Hệ thống sẽ tự quay về khu vực bàn sau vài giây.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-slate-200"
            onClick={onPrint}
          >
            <ReceiptText className="mr-2 h-4 w-4" />
            In hóa đơn
          </Button>
          <Button
            type="button"
            onClick={onCreateNewOrder}
            className="rounded-full bg-orange-500 hover:bg-orange-600"
          >
            Tạo đơn mới
          </Button>
        </div>
      </div>
    </div>
  );
};
