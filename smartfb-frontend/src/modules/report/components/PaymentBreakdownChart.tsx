import { CreditCard, RefreshCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@shared/components/common/DatePicker';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import type { PaymentMethodBreakdown } from '../types/report.types';

const PAYMENT_SKELETON_KEYS = ['cash', 'momo', 'vietqr', 'bank-transfer', 'other'];

interface PaymentBreakdownChartProps {
  data?: PaymentMethodBreakdown;
  branchName: string;
  isLoading: boolean;
  isError: boolean;
  selectedDate: string;
  onDateChange: (value: string) => void;
  onRetry: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  'Tiền mặt': '#e8692a',
  MOMO: '#d82d8b',
  VietQR: '#0f766e',
  'Chuyển khoản': '#2563eb',
  Khác: '#6b7280',
};

/**
 * Breakdown thanh toán hiển thị dạng biểu đồ tròn.
 */
export const PaymentBreakdownChart = ({
  data,
  branchName,
  isLoading,
  isError,
  selectedDate,
  onDateChange,
  onRetry,
}: PaymentBreakdownChartProps) => {
  // Giữ đủ danh sách phương thức mặc định để chart không bị trống khi backend trả mảng rỗng.
  const methods = data?.methods.length
    ? data.methods
    : Object.keys(METHOD_COLORS).map((method) => ({
        method,
        amount: 0,
        percentage: 0,
        transactionCount: 0,
      }));

  const hasData = Boolean(methods.some((method) => method.amount > 0));
  const pieData = hasData
    ? methods.filter((method) => method.amount > 0)
    : [{ method: 'Empty', amount: 1 }];

  return (
    <section className="card space-y-5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <CreditCard className="h-4 w-4 text-primary" />
            Phương thức thanh toán
          </div>
          <h3 className="mt-2 text-lg font-semibold text-text-primary">{branchName}</h3>
        </div>

        <div className="w-full space-y-1.5 sm:w-[190px]">
          <label
            className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
            htmlFor="payment-breakdown-date"
          >
            Ngày thanh toán
          </label>
          <DatePicker
            id="payment-breakdown-date"
            value={selectedDate}
            onChange={onDateChange}
            className="w-full"
            align="end"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {PAYMENT_SKELETON_KEYS.map((key) => (
            <div key={key} className="space-y-2">
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
            Dữ liệu của ngày này chưa ghi nhận được.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card bg-[#fffaf6] p-4 text-center sm:text-left">
              <p className="text-sm text-text-secondary">Tổng doanh thu theo ngày</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatVND(data.totalRevenue)}</p>
            </div>
            <div className="rounded-card bg-[#fffaf6] p-4 text-center sm:text-left">
              <p className="text-sm text-text-secondary">Tổng số giao dịch ước tính</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatNumber(data.totalOrders)}</p>
            </div>
          </div>

          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.method}
                      fill={!hasData ? '#ffffff' : (METHOD_COLORS[entry.method] ?? '#e8692a')}
                      stroke={!hasData ? '#e5e7eb' : 'none'}
                      strokeWidth={!hasData ? 2 : 1}
                    />
                  ))}
                </Pie>
                {hasData && (
                  <Tooltip
                    formatter={(value, name) => {
                      const amount = Number(value ?? 0);
                      const methodName = String(name ?? '');
                      const methodInfo = methods.find((method) => method.method === methodName);
                      const percentStr = methodInfo ? ` (${methodInfo.percentage.toFixed(1)}%)` : '';

                      return [`${formatVND(amount)}${percentStr}`, methodName];
                    }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ display: 'none' }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Luôn hiển thị đủ legend để chủ quán biết các phương thức chưa phát sinh doanh thu. */}
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1">
            {methods.map((method) => (
              <li key={method.method} className="flex items-center gap-1 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: METHOD_COLORS[method.method] ?? '#e8692a' }}
                />
                <span className="text-text-secondary">:</span>
                <span className="font-medium text-text-primary">
                  {method.method}{' '}
                  <span className="font-normal text-text-secondary">
                    ({method.percentage.toFixed(1)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
