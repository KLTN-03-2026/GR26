import { Package2, RefreshCcw } from 'lucide-react';
import { DatePicker } from '@shared/components/common/DatePicker';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import type { TopItemsReport } from '../types/report.types';

const TOP_ITEMS_SKELETON_KEYS = ['rank-1', 'rank-2', 'rank-3', 'rank-4', 'rank-5'];

interface TopItemsChartProps {
  data?: TopItemsReport;
  branchName: string;
  isLoading: boolean;
  isError: boolean;
  selectedDate: string;
  onDateChange: (value: string) => void;
  onRetry: () => void;
}

/**
 * Chart top món bán chạy dưới dạng thanh ngang.
 * Chọn doanh thu làm thước đo chính vì gần với quyết định kinh doanh hơn số lượng đơn thuần.
 */
export const TopItemsChart = ({
  data,
  branchName,
  isLoading,
  isError,
  selectedDate,
  onDateChange,
  onRetry,
}: TopItemsChartProps) => {
  const maxRevenue = Math.max(...(data?.topItems.map((item) => item.revenue) ?? [0]));

  return (
    <section className="card space-y-5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Package2 className="h-4 w-4 text-primary" />
            Top sản phẩm bán chạy
          </div>
          <h3 className="mt-2 text-lg font-semibold text-text-primary">{branchName}</h3>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <div className="w-full space-y-1.5 sm:w-[190px]">
            <label
              className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary"
              htmlFor="top-items-date"
            >
              Ngày xem top món
            </label>
            <DatePicker
              id="top-items-date"
              value={selectedDate}
              onChange={onDateChange}
              className="w-full"
              align="end"
            />
          </div>

          {data?.topItems.length ? (
            <div className="rounded-card bg-primary-light px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Món dẫn đầu</p>
              <p className="mt-1 text-base font-bold text-text-primary">{data.topItems[0].itemName}</p>
              <p className="text-sm text-text-secondary">{formatVND(data.topItems[0].revenue)}</p>
            </div>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {TOP_ITEMS_SKELETON_KEYS.map((key) => (
            <div key={key} className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-[#f5efe8]" />
              <div className="h-3 animate-pulse rounded-full bg-[#f5efe8]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-card border border-dashed border-danger-text/30 bg-danger-light/40 p-5">
          <p className="font-medium text-danger-text">Không thể tải top sản phẩm.</p>
          <p className="mt-1 text-sm text-text-secondary">
            API top-items đang lỗi hoặc chưa có dữ liệu cho ngày đang chọn.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      ) : !data ? (
        <div className="rounded-card border border-dashed border-border bg-[#fffaf6] p-8 text-center">
          <p className="text-base font-semibold text-text-primary">Chưa có món nào phát sinh doanh thu</p>
          <p className="mt-2 text-sm text-text-secondary">
            Hãy chọn ngày khác hoặc kiểm tra xem chi nhánh đã có đơn hoàn tất hay chưa.
          </p>
        </div>
      ) : data.topItems.length === 0 ? (
        <div className="rounded-card bg-[#fffaf6] p-6 text-center">
          <p className="text-sm font-medium text-text-secondary">0 sản phẩm phát sinh doanh thu trong ngày</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.topItems.map((item) => {
            const width = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 10) : 10;

            return (
              <div key={item.itemId} className="rounded-card bg-[#fffaf6] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                        #{item.rank}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text-primary">{item.itemName}</p>
                        <p className="text-sm text-text-secondary">
                          {formatNumber(item.qtySold)} suất bán ra
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-text-primary">{formatVND(item.revenue)}</p>
                    <p className="text-sm text-text-secondary">
                      Biên lợi nhuận: {item.grossMargin.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-3 rounded-full bg-[#f3e9e0]">
                  <div
                    className="h-3 rounded-full bg-primary"
                    style={{ width: `${Math.min(width, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
