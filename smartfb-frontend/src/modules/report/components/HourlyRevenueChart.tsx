import { TrendingUp, RefreshCcw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import type { HourlyRevenueHeatmap } from '../types/report.types';

interface HourlyRevenueChartProps {
  data?: HourlyRevenueHeatmap;
  branchName: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const formatHourLabel = (hour: number) => `${String(hour).padStart(2, '0')}h`;

const formatYAxisTick = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-text-primary">{formatHourLabel(item.hour)}</p>
      <p className="text-xs font-semibold text-primary">{formatVND(item.revenue)}</p>
      <p className="text-[10px] text-text-secondary">{item.orderCount} đơn</p>
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Biểu đồ đường (area chart) doanh thu theo giờ dùng Recharts.
 * Luôn render chart kể cả khi tất cả giá trị = 0.
 */
export const HourlyRevenueChart = ({
  data,
  branchName,
  isLoading,
  isError,
  onRetry,
}: HourlyRevenueChartProps) => {
  const peakHourEntry =
    data?.hourlyData.reduce((currentMax, item) =>
      item.revenue > currentMax.revenue ? item : currentMax,
    ) ?? null;
  const totalDailyOrders =
    data?.hourlyData.reduce((total, item) => total + item.orderCount, 0) ?? 0;
  const totalDailyRevenue =
    data?.hourlyData.reduce((total, item) => total + item.revenue, 0) ?? 0;
  const hasData = Boolean(data?.hourlyData.some((item) => item.revenue > 0 || item.orderCount > 0));

  const chartData =
    data?.hourlyData.map((item) => ({
      ...item,
      label: formatHourLabel(item.hour),
    })) ?? [];

  return (
    <section className="card space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <TrendingUp className="h-4 w-4 text-primary" />
            Doanh thu theo giờ
          </div>
          <h3 className="mt-2 text-lg font-semibold text-text-primary">{branchName}</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Theo dõi giờ cao điểm để tối ưu phân ca nhân sự và vận hành trong ngày.
          </p>
        </div>

        {peakHourEntry && hasData ? (
          <div className="rounded-card bg-primary-light px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Giờ cao điểm</p>
            <p className="mt-1 text-lg font-bold text-text-primary">{formatHourLabel(peakHourEntry.hour)}</p>
            <p className="text-sm text-text-secondary">{formatVND(peakHourEntry.revenue)}</p>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-card bg-[#f5efe8]" />
            ))}
          </div>
          <div className="h-52 animate-pulse rounded-card bg-[#f5efe8]" />
        </div>
      ) : isError ? (
        <div className="rounded-card border border-dashed border-danger-text/30 bg-danger-light/40 p-5">
          <p className="font-medium text-danger-text">Không thể tải biểu đồ doanh thu theo giờ.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Kiểm tra lại dữ liệu ngày phân tích hoặc thử gọi lại API.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : !data ? (
        <div className="rounded-card border border-dashed border-border bg-[#fffaf6] p-8 text-center">
          <p className="text-base font-semibold text-text-primary">Chưa có dữ liệu theo giờ</p>
          <p className="mt-2 text-sm text-text-secondary">
            Backend đã phản hồi thành công nhưng ngày đang chọn chưa phát sinh đơn hàng hoặc doanh thu.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-card bg-[#fffaf6] p-4">
              <p className="text-sm text-text-secondary">Doanh thu trong ngày</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatVND(totalDailyRevenue)}</p>
            </div>
            <div className="rounded-card bg-[#fffaf6] p-4">
              <p className="text-sm text-text-secondary">Tổng đơn trong ngày</p>
              <p className="mt-2 text-xl font-bold text-text-primary">{formatNumber(totalDailyOrders)}</p>
            </div>
            <div className="rounded-card bg-[#fffaf6] p-4">
              <p className="text-sm text-text-secondary">Giờ đạt đỉnh</p>
              <p className="mt-2 text-xl font-bold text-text-primary">
                {peakHourEntry && hasData ? formatHourLabel(peakHourEntry.hour) : '--'}
              </p>
            </div>
          </div>

          {/* ── Recharts Area Chart ─────────────────────────────────── */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" stroke="#e8ddd4" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b5e52', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#d6cbc0' }}
                  interval={2}
                />

                <YAxis
                  tickFormatter={formatYAxisTick}
                  tick={{ fontSize: 10, fill: '#9c8b7a' }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1f1f1f', strokeDasharray: '3 3', strokeOpacity: 0.3 }} />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{ r: 3, fill: '#f97316', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#1f1f1f', stroke: '#fff', strokeWidth: 2 }}
                />

                {/* Peak hour marker */}
                {peakHourEntry && hasData && (
                  <ReferenceDot
                    x={formatHourLabel(peakHourEntry.hour)}
                    y={peakHourEntry.revenue}
                    r={6}
                    fill="#1f1f1f"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
};
