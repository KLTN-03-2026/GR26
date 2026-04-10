import type { ReactNode } from 'react';
import { CreditCard, QrCode, Wallet } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { formatVND } from '@shared/utils/formatCurrency';

export type PaymentMethod = 'cash' | 'card' | 'qr';

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'cash',
    label: 'Tiền mặt',
    description: 'Nhập số tiền khách đưa để tính tiền thừa.',
    icon: <Wallet className="h-5 w-5 text-emerald-500" />,
  },
  {
    id: 'card',
    label: 'Thẻ ngân hàng',
    description: 'Dùng POS hoặc máy quẹt thẻ tại quầy.',
    icon: <CreditCard className="h-5 w-5 text-blue-500" />,
  },
  {
    id: 'qr',
    label: 'Chuyển khoản / QR',
    description: 'Hiển thị mã QR để khách thanh toán nhanh.',
    icon: <QrCode className="h-5 w-5 text-orange-500" />,
  },
];

interface PaymentSidebarProps {
  selectedMethod: PaymentMethod;
  amountReceived: string;
  orderNumber: string | null;
  totalAmount: number;
  subtotal: number;
  vatAmount: number;
  changeAmount: number;
  canConfirmPayment: boolean;
  isProcessing: boolean;
  onSelectMethod: (method: PaymentMethod) => void;
  onAmountReceivedChange: (value: string) => void;
  onConfirmPayment: () => void;
}

export const PaymentSidebar = ({
  selectedMethod,
  amountReceived,
  orderNumber,
  totalAmount,
  subtotal,
  vatAmount,
  changeAmount,
  canConfirmPayment,
  isProcessing,
  onSelectMethod,
  onAmountReceivedChange,
  onConfirmPayment,
}: PaymentSidebarProps) => {
  return (
    <aside className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-900">Phương thức thanh toán</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn cách nhận tiền phù hợp tại quầy.</p>
      </div>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelectMethod(method.id)}
            className={`w-full rounded-[24px] border p-4 text-left transition-colors ${
              selectedMethod === method.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                {method.icon}
              </div>
              <div>
                <p className="font-black text-slate-900">{method.label}</p>
                <p className="text-sm text-slate-500">{method.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedMethod === 'cash' && (
        <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
          <label htmlFor="cash-received" className="text-sm font-bold text-slate-600">
            Số tiền khách đưa
          </label>
          <Input
            id="cash-received"
            type="number"
            value={amountReceived}
            onChange={(event) => onAmountReceivedChange(event.target.value)}
            placeholder="Nhập số tiền..."
            className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-orange-500"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tiền thừa trả khách</span>
            <span className="font-black text-emerald-500">{formatVND(changeAmount)}</span>
          </div>
        </div>
      )}

      {selectedMethod === 'qr' && (
        <div className="rounded-[24px] bg-slate-50 p-4 text-center">
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-[24px] bg-white">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=SMARTFNB_${orderNumber ?? 'ORDER'}_${totalAmount}`}
              alt="QR thanh toán"
              className="h-40 w-40"
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">Mã QR tạm để demo UI thanh toán tại quầy.</p>
        </div>
      )}

      <div className="space-y-3 rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between text-slate-500">
          <span>Tạm tính</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>VAT (8%)</span>
          <span>{formatVND(vatAmount)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 text-xl font-black text-slate-900">
          <span>Tổng thanh toán</span>
          <span className="text-orange-500">{formatVND(totalAmount)}</span>
        </div>
      </div>

      <Button
        type="button"
        disabled={!canConfirmPayment}
        onClick={onConfirmPayment}
        className="h-12 w-full rounded-full bg-orange-500 text-base font-bold hover:bg-orange-600"
      >
        {isProcessing ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
      </Button>
    </aside>
  );
};
