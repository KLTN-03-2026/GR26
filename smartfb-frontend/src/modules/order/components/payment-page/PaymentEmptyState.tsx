import { ReceiptText } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface PaymentEmptyStateProps {
  onBackToOrder: () => void;
}

export const PaymentEmptyState = ({ onBackToOrder }: PaymentEmptyStateProps) => {
  return (
    <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
      <div className="max-w-md text-center">
        <ReceiptText className="mx-auto h-16 w-16 text-slate-300" />
        <h1 className="mt-6 text-3xl font-black text-slate-900">Chưa có đơn hợp lệ để thanh toán</h1>
        <p className="mt-3 text-slate-500">
          Quay lại màn tạo đơn để chọn món và tạo đơn trên hệ thống trước khi thanh toán.
        </p>
        <Button
          type="button"
          onClick={onBackToOrder}
          className="mt-6 rounded-full bg-orange-500 hover:bg-orange-600"
        >
          Quay lại tạo đơn
        </Button>
      </div>
    </div>
  );
};
