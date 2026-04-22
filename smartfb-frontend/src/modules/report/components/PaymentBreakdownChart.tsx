import { CreditCard, RefreshCcw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import type { PaymentMethodBreakdown } from '../types/report.types';

interface PaymentBreakdownChartProps {
  data?: PaymentMethodBreakdown;
  branchName: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  'Tiền mặt': 'bg-[#e8692a]',
  MOMO: 'bg-[#d82d8b]',
  VietQR: 'bg-[#0f766e]',
  'Chuyển khoản': 'bg-[#2563eb]',
  Khác: 'bg-[#6b7280]',
};

/**
 * Breakdown thanh toán hiển thị dạng progress bar để thay cho pie chart.
 * Cách này gọn, dễ đọc trên mobile và không cần thư viện biểu đồ bên ngoài.
 */
export const PaymentBreakdownChart = ({
  data,
  branchName,
  isLoading,
  isError,
  onRetry,
}: PaymentBreakdownChartProps) => {
  const hasData = Boolean(data?.methods.some((method) => method.amount > 0));

  return (
    <section className="card space-y-5 p-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <CreditCard className="h-4 w-4 text-primary" />
          Tỷ trọng thanh toán
        </div>
        <h3 className="mt-2 text-lg font-semibold text-text-primary">{branchName}</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Phân tích kênh thanh toán nổi trội để tối ưu ưu đãi và luồng thanh toán tại quầy.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-[#f5efe8]" />
              <div className="h-3 animate-pulse rounded-full bg-[#f5efe8]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-card border border-dashed border-danger-text/30 bg-danger-light/40 p-5">
          <p className="font-medium text-danger-text">Không thể tải cơ cấu thanh toán.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Dữ liệu thanh toán của ngày đang chọn chưa lấy được từ backend.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : !data ? (
        <div className="rounded-card border border-dashed border-border bg-[#fffaf6] p-8 text-center">
          <p className="text-base font-semibold text-text-primary">Chưa có giao dịch thanh toán</p>
          <p className="mt-2 text-sm text-text-secondary">
            Ngày này chưa ghi nhận giao dịch nên cơ cấu thanh toán chưa có gì để phân tích.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card bg-[#fffaf6] p-4">
              <p className="text-sm text-text-secondary">Tổng doanh thu theo ngày</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatVND(data.totalRevenue)}</p>
            </div>
            <div className="rounded-card bg-[#fffaf6] p-4">
              <p className="text-sm text-text-secondary">Tổng số giao dịch ước tính</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatNumber(data.totalOrders)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {data.methods.map((method) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{method.method}</p>
                    <p className="text-xs text-text-secondary">
                      {formatNumber(method.transactionCount)} giao dịch
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">{formatVND(method.amount)}</p>
                    <p className="text-xs text-text-secondary">{method.percentage.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="h-3 rounded-full bg-[#f5efe8]">
                  <div
                    className={`h-3 rounded-full ${METHOD_COLORS[method.method] ?? 'bg-primary'}`}
                    style={{ width: `${Math.min(method.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
