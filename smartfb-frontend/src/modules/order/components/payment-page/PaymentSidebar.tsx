import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock, CreditCard, QrCode, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { formatVND } from '@shared/utils/formatCurrency';
import {
  formatNumericInputValue,
  sanitizeIntegerInputValue,
} from '@shared/utils/numberInput';

export type PaymentMethod = 'cash' | 'card' | 'qr';
export type QRSubMethod = 'VIETQR' | 'MOMO' | 'PAYOS';
export type QRState = 'idle' | 'generating' | 'active' | 'expired';

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}

interface QRSubMethodOption {
  id: QRSubMethod;
  label: string;
  color: string;
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

const QR_SUB_METHODS: QRSubMethodOption[] = [
  { id: 'VIETQR', label: 'VietQR', color: 'border-blue-500 bg-blue-50' },
  { id: 'MOMO', label: 'MoMo', color: 'border-pink-500 bg-pink-50' },
  { id: 'PAYOS', label: 'PayOS', color: 'border-indigo-500 bg-indigo-50' },
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
  // QR-specific props
  qrSubMethod: QRSubMethod;
  qrState: QRState;
  qrCodeUrl: string | null;
  qrCodeData: string | null;
  qrTimeLeft: number;
  qrPollingMessage: string | null;
  isPayOSEnabled: boolean;
  payOSDisabledMessage: string;
  isManualConfirming: boolean;
  onSelectQRSubMethod: (method: QRSubMethod) => void;
  onManualConfirmQR: () => void;
  onRegenerateQR: () => void;
}

/**
 * Định dạng giây còn lại thành mm:ss để hiển thị countdown.
 */
const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

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
  qrSubMethod,
  qrState,
  qrCodeUrl,
  qrCodeData,
  qrTimeLeft,
  qrPollingMessage,
  isPayOSEnabled,
  payOSDisabledMessage,
  isManualConfirming,
  onSelectQRSubMethod,
  onManualConfirmQR,
  onRegenerateQR,
}: PaymentSidebarProps) => {
  // Tính label và disabled cho nút chính
  const mainButtonLabel = (() => {
    if (selectedMethod !== 'qr') {
      return isProcessing ? 'Đang xác nhận...' : 'Xác nhận thanh toán';
    }
    if (qrState === 'idle') return 'Tạo mã QR';
    if (qrState === 'generating') return 'Đang tạo mã QR...';
    if (qrState === 'expired') return 'Tạo lại mã QR';
    return null; // active: ẩn nút chính, hiện nút manual confirm
  })();

  const mainButtonDisabled = (() => {
    if (selectedMethod !== 'qr') return !canConfirmPayment;
    if (qrState === 'generating') return true;
    if (qrState === 'active') return true;
    if (qrSubMethod === 'PAYOS' && !isPayOSEnabled) return true;
    return false;
  })();

  const handleMainButtonClick = () => {
    if (selectedMethod !== 'qr') {
      onConfirmPayment();
      return;
    }
    if (qrState === 'idle' || qrState === 'expired') {
      onConfirmPayment(); // PaymentPage xử lý generate QR
    }
  };

  return (
    <aside className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-900">Phương thức thanh toán</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn cách nhận tiền phù hợp tại quầy.</p>
      </div>

      {/* Danh sách phương thức — ẩn khi QR đang hiển thị */}
      {qrState !== 'active' && (
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
      )}

      {/* Section tiền mặt */}
      {selectedMethod === 'cash' && (
        <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
          <label htmlFor="cash-received" className="text-sm font-bold text-slate-600">
            Số tiền khách đưa
          </label>
          <Input
            id="cash-received"
            type="text"
            inputMode="numeric"
            value={formatNumericInputValue(amountReceived)}
            onChange={(event) => onAmountReceivedChange(sanitizeIntegerInputValue(event.target.value))}
            placeholder="Nhập số tiền..."
            className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-orange-500"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tiền thừa trả khách</span>
            <span className="font-black text-emerald-500">{formatVND(changeAmount)}</span>
          </div>
        </div>
      )}

      {/* Section QR — chọn sub-method */}
      {selectedMethod === 'qr' && qrState === 'idle' && (
        <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-600">Chọn ứng dụng thanh toán</p>
          <div className="flex gap-3">
            {QR_SUB_METHODS.map((sub) => {
              const isDisabled = sub.id === 'PAYOS' && !isPayOSEnabled;

              return (
                <button
                  key={sub.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectQRSubMethod(sub.id)}
                  className={`flex-1 rounded-2xl border-2 py-3 text-center text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${
                    qrSubMethod === sub.id
                      ? sub.color
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
          {isPayOSEnabled ? (
            <p className="text-xs text-slate-400">
              Bấm "Tạo mã QR" để tạo mã và hiển thị cho khách quét.
            </p>
          ) : (
            <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{payOSDisabledMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Section QR đang generating */}
      {selectedMethod === 'qr' && qrState === 'generating' && (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-slate-50 p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Đang tạo mã QR...</p>
        </div>
      )}

      {/* Section QR đang active — hiển thị QR + countdown */}
      {selectedMethod === 'qr' && qrState === 'active' && qrCodeUrl && (
        <div className="space-y-4">
          {/* QR image */}
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">
              Quét mã QR để thanh toán {formatVND(totalAmount)}
            </p>
            <div className="flex h-48 w-48 items-center justify-center rounded-[24px] bg-white shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeData || qrCodeUrl)}`}
                alt="Mã QR thanh toán"
                className="h-44 w-44 rounded-xl"
              />
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-slate-500">Mã hết hạn sau</span>
              <span className={`font-black tabular-nums ${qrTimeLeft <= 30 ? 'text-red-500' : 'text-orange-500'}`}>
                {formatCountdown(qrTimeLeft)}
              </span>
            </div>

            {/* Tên app */}
            <p className="text-xs text-slate-400">
              {qrSubMethod === 'VIETQR' && 'Dùng app ngân hàng bất kỳ (VietQR) để quét'}
              {qrSubMethod === 'MOMO' && 'Dùng app MoMo để quét'}
              {qrSubMethod === 'PAYOS' && 'Dùng app ngân hàng bất kỳ để quét (qua PayOS)'}
            </p>
          </div>

          {qrPollingMessage && (
            <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{qrPollingMessage}</span>
            </div>
          )}

          {/* Nút xác nhận thủ công */}
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-xs text-amber-700">
              Nếu khách đã thanh toán nhưng hệ thống chưa cập nhật, thu ngân có thể xác nhận thủ công.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl border-amber-400 text-amber-700 hover:bg-amber-100"
              disabled={isManualConfirming}
              onClick={onManualConfirmQR}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isManualConfirming ? 'Đang xác nhận...' : 'Xác nhận thủ công'}
            </Button>
          </div>
        </div>
      )}

      {/* Section QR đã hết hạn */}
      {selectedMethod === 'qr' && qrState === 'expired' && (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="font-bold text-red-700">Mã QR đã hết hạn</p>
          <p className="text-sm text-red-600">
            Mã QR chỉ có hiệu lực 3 phút. Chọn ứng dụng và tạo lại mã mới.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-1 rounded-2xl border-red-300 text-red-600 hover:bg-red-100"
            onClick={onRegenerateQR}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tạo lại QR
          </Button>
        </div>
      )}

      {/* Tóm tắt giá */}
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

      {/* Nút chính — ẩn khi QR active (dùng nút manual confirm thay thế) */}
      {mainButtonLabel !== null && (
        <Button
          type="button"
          disabled={mainButtonDisabled}
          onClick={handleMainButtonClick}
          className="h-12 w-full rounded-full bg-orange-500 text-base font-bold hover:bg-orange-600 disabled:opacity-50"
        >
          {qrState === 'generating' && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {mainButtonLabel}
        </Button>
      )}

      {/* Thông báo đang chờ khi QR active */}
      {selectedMethod === 'qr' && qrState === 'active' && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          Đang chờ khách thanh toán...
        </div>
      )}

      {/* Ghi chú đơn hàng */}
      {orderNumber && (
        <p className="text-center text-xs text-slate-400">Đơn hàng {orderNumber}</p>
      )}
    </aside>
  );
};
