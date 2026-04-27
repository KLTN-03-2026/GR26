import { CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { useTrainConfig } from '../hooks/useForecast';

/** Ngưỡng tối thiểu để AI hoạt động chính xác — phải khớp với AI service */
const MIN_DAYS_REQUIRED = 90;

interface DataReadinessCardProps {
  branchId: string;
}

/**
 * Hiển thị tiến độ thu thập data của chi nhánh so với ngưỡng 90 ngày.
 * Giúp chủ quán biết chi nhánh đã đủ điều kiện sử dụng AI dự báo chưa.
 */
export const DataReadinessCard = ({ branchId }: DataReadinessCardProps) => {
  const { data: config, isLoading } = useTrainConfig(branchId);

  if (isLoading || !config) return null;

  const activeDays = config.active_days;
  const progressPct = Math.min((activeDays / MIN_DAYS_REQUIRED) * 100, 100);
  const remaining = Math.max(MIN_DAYS_REQUIRED - activeDays, 0);

  // Xác định trạng thái
  const isReady = activeDays >= MIN_DAYS_REQUIRED;
  const isPartial = activeDays >= 30 && activeDays < MIN_DAYS_REQUIRED;

  const statusConfig = isReady
    ? {
        icon: CheckCircle,
        iconClass: 'text-green-600',
        barClass: 'bg-green-500',
        badgeClass: 'bg-green-100 text-green-700 border-green-200',
        badgeLabel: 'AI sẵn sàng',
        message: `Chi nhánh có ${activeDays} ngày data — AI dự báo hoạt động đầy đủ.`,
      }
    : isPartial
      ? {
          icon: AlertTriangle,
          iconClass: 'text-amber-500',
          barClass: 'bg-amber-400',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
          badgeLabel: 'Đủ tối thiểu',
          message: `Cần thêm ${remaining} ngày data để AI đạt độ chính xác tối ưu.`,
        }
      : {
          icon: XCircle,
          iconClass: 'text-red-500',
          barClass: 'bg-red-400',
          badgeClass: 'bg-red-100 text-red-700 border-red-200',
          badgeLabel: 'Chưa đủ data',
          message: `Cần thêm ${remaining} ngày data trước khi AI có thể dự báo.`,
        };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Dữ liệu huấn luyện AI</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.badgeClass}`}
        >
          <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.iconClass}`} />
          {statusConfig.badgeLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusConfig.barClass}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{statusConfig.message}</span>
        <span className="font-medium tabular-nums">
          {activeDays} / {MIN_DAYS_REQUIRED} ngày
        </span>
      </div>

      {/* Thông tin bổ sung nếu chưa đủ data */}
      {!isReady && config.first_order_date && (
        <p className="mt-2 text-xs text-text-secondary">
          Đơn đầu tiên: {config.first_order_date}
          {config.last_order_date ? ` · Gần nhất: ${config.last_order_date}` : ''}
        </p>
      )}
    </div>
  );
};
