import { useState, useEffect } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BrainCircuit, RefreshCw, CheckCircle2, XCircle, Loader2, Clock, History } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { usePermission } from '@shared/hooks/usePermission';
import { useForecast, useTriggerPredict, useTrainLogs } from '../hooks/useForecast';
import type { IngredientForecast } from '../types';
import { DataReadinessCard } from './DataReadinessCard';
import { ForecastConfigSheet } from './ForecastConfigSheet';
import { IngredientDetailSheet } from './IngredientDetailSheet';

// ─── Urgency badge ────────────────────────────────────────────────────────────

interface UrgencyBadgeProps {
  urgency: IngredientForecast['urgency'];
}

const URGENCY_CONFIG = {
  critical: { label: 'Nhập ngay', className: 'bg-red-100 text-red-700 border-red-200' },
  warning:  { label: 'Sắp hết',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ok:       { label: 'Đủ hàng',  className: 'bg-green-100 text-green-700 border-green-200' },
} as const;

const UrgencyBadge = ({ urgency }: UrgencyBadgeProps) => {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

// ─── Summary cards ────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  criticalCount: number;
  warningCount: number;
  okCount: number;
}

const SummaryCards = ({ criticalCount, warningCount, okCount }: SummaryCardsProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    <div className="card">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-red-100">
          <span className="text-lg">🔴</span>
        </div>
        <span className="font-medium text-text-primary">Cần nhập ngay</span>
      </div>
      <div className="text-3xl font-bold text-red-600">{String(criticalCount).padStart(2, '0')}</div>
    </div>
    <div className="card">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-amber-100">
          <span className="text-lg">🟡</span>
        </div>
        <span className="font-medium text-text-primary">Sắp hết hàng</span>
      </div>
      <div className="text-3xl font-bold text-amber-600">{String(warningCount).padStart(2, '0')}</div>
    </div>
    <div className="card">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-green-100">
          <span className="text-lg">🟢</span>
        </div>
        <span className="font-medium text-text-primary">Đủ hàng</span>
      </div>
      <div className="text-3xl font-bold text-green-600">{String(okCount).padStart(2, '0')}</div>
    </div>
  </div>
);

// ─── Ingredient card ──────────────────────────────────────────────────────────

interface IngredientCardProps {
  ingredient: IngredientForecast;
}

const IngredientCard = ({ ingredient }: IngredientCardProps) => {
  const today = new Date();

  // Tính số ngày còn lại đến khi hết hàng
  const daysUntilStockout = ingredient.stockout_date
    ? differenceInCalendarDays(parseISO(ingredient.stockout_date), today)
    : null;

  const stockoutLabel =
    ingredient.stockout_date != null && daysUntilStockout !== null
      ? `Dự kiến hết: ${format(parseISO(ingredient.stockout_date), 'dd/MM/yyyy', { locale: vi })} (còn ${daysUntilStockout} ngày)`
      : '✓ Đủ hàng trong kỳ dự báo';

  const orderLabel = `Nên nhập ${ingredient.suggested_order_qty} ${ingredient.unit} vào ${format(parseISO(ingredient.suggested_order_date), 'dd/MM/yyyy', { locale: vi })}`;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={ingredient.urgency} />
          {ingredient.is_fallback && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Dự báo tạm thời
            </span>
          )}
        </div>
        <span className="text-xs text-text-secondary">
          Tồn: <strong>{ingredient.current_stock} {ingredient.unit}</strong>
        </span>
      </div>

      <p className="font-semibold text-text-primary">{ingredient.ingredient_name}</p>

      <div className="space-y-1 text-sm text-text-secondary">
        <p className={ingredient.stockout_date ? 'text-red-600' : 'text-green-700'}>
          {stockoutLabel}
        </p>
        <p>
          <span className="font-medium text-text-primary">Gợi ý: </span>
          {orderLabel}
        </p>
      </div>
    </div>
  );
};

// ─── Train logs panel ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  success: { label: 'Thành công', icon: CheckCircle2, color: 'text-emerald-600' },
  failed:  { label: 'Thất bại',   icon: XCircle,      color: 'text-red-500'     },
  running: { label: 'Đang chạy',  icon: Loader2,      color: 'text-amber-500'   },
} as const;

interface TrainLogsPanelProps {
  branchId: string;
}

const TrainLogsPanel = ({ branchId }: TrainLogsPanelProps) => {
  const { data, isLoading } = useTrainLogs(branchId, 10);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="spinner spinner-sm" />
      </div>
    );
  }

  if (!data || data.logs.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-border bg-card text-center">
        <History className="h-8 w-8 text-text-secondary opacity-30" />
        <p className="text-sm text-text-secondary">Chưa có lịch sử train</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.logs.map((log) => {
        const key = (log.status === 'success' || log.status === 'failed' || log.status === 'running')
          ? log.status : 'running';
        const cfg = STATUS_CONFIG[key];
        const StatusIcon = cfg.icon;
        const startLabel = log.started_at
          ? format(parseISO(log.started_at), 'dd/MM/yyyy HH:mm', { locale: vi })
          : '—';

        return (
          <div
            key={log.id}
            className="flex items-start justify-between gap-3 rounded-card border border-border bg-card px-4 py-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color} ${log.status === 'running' ? 'animate-spin' : ''}`} />
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${cfg.color}`}>
                  {cfg.label}
                  <span className="ml-2 text-xs font-normal text-text-secondary">
                    {log.trigger_type === 'manual' ? '· Thủ công' : '· Tự động'}
                  </span>
                </p>
                {log.status === 'success' && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {log.series_count != null ? `${log.series_count} nguyên liệu` : ''}
                    {log.mape != null ? ` · MAPE ${log.mape.toFixed(1)}%` : ''}
                    {log.mae != null && log.mape == null ? ` · MAE ${log.mae.toFixed(3)}` : ''}
                  </p>
                )}
                {log.status === 'failed' && log.error_message && (
                  <p className="text-xs text-red-500 mt-0.5 line-clamp-2">{log.error_message}</p>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-text-secondary">{startLabel}</p>
              {log.duration_seconds != null && (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-text-secondary">
                  <Clock className="h-3 w-3" />
                  {log.duration_seconds < 60
                    ? `${Math.round(log.duration_seconds)}s`
                    : `${Math.round(log.duration_seconds / 60)}m ${Math.round(log.duration_seconds % 60)}s`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main content ─────────────────────────────────────────────────────────────

const URGENCY_ORDER: Record<IngredientForecast['urgency'], number> = {
  critical: 0,
  warning: 1,
  ok: 2,
};

/**
 * Nội dung trang Dự báo tồn kho AI.
 * Đọc kết quả từ AI Service (đã được tính sẵn mỗi đêm), không chạy model realtime.
 */
export const AiForecastContent = () => {
  const branchId = useAuthStore((state) => state.user?.branchId ?? '');
  const { isOwner } = usePermission();
  const { data, isLoading, isError, refetch } = useForecast(branchId);
  const triggerPredict = useTriggerPredict(branchId);

  const [selectedIngredient, setSelectedIngredient] = useState<IngredientForecast | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9; // 3 cột × 3 hàng

  // Reset page khi data thay đổi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [branchId, data?.generated_at]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="mb-3 text-lg font-semibold text-red-700">Không thể tải dữ liệu dự báo</p>
        <p className="mb-4 text-sm text-red-600">
          Kiểm tra kết nối đến AI Service (port 8001) rồi thử lại.
        </p>
        <Button onClick={() => void refetch()}>Thử lại</Button>
      </div>
    );
  }

  const ingredients = data?.ingredients ?? [];

  // Sort: critical → warning → ok
  const sorted = [...ingredients].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagedIngredients = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const criticalCount = ingredients.filter((i) => i.urgency === 'critical').length;
  const warningCount  = ingredients.filter((i) => i.urgency === 'warning').length;
  const okCount       = ingredients.filter((i) => i.urgency === 'ok').length;

  const generatedAt = data?.generated_at
    ? format(parseISO(data.generated_at), "dd/MM/yyyy HH:mm", { locale: vi })
    : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-text-primary">Dự báo tồn kho AI</h1>
          </div>
          {generatedAt && (
            <p className="mt-1 text-sm text-text-secondary">
              Cập nhật lúc {generatedAt}
            </p>
          )}
        </div>

        {/* Nút OWNER: cài đặt + kích hoạt */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <ForecastConfigSheet branchId={branchId} />
            <Button
              variant="outline"
              size="sm"
              disabled={triggerPredict.isPending}
              onClick={() => triggerPredict.mutate()}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${triggerPredict.isPending ? 'animate-spin' : ''}`} />
              {triggerPredict.isPending ? 'Đang cập nhật...' : 'Cập nhật dự báo'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs: Dự báo | Lịch sử train */}
      <Tabs defaultValue="forecast">
        <TabsList variant="line">
          <TabsTrigger value="forecast">Dự báo</TabsTrigger>
          <TabsTrigger value="history">Lịch sử train</TabsTrigger>
        </TabsList>

        {/* ── Tab Dự báo ── */}
        <TabsContent value="forecast">
          <div className="space-y-6 pt-4">
            {/* Thanh tiến độ data — hiển thị với mọi role */}
            <DataReadinessCard branchId={branchId} />

            {/* Summary cards */}
            <SummaryCards
              criticalCount={criticalCount}
              warningCount={warningCount}
              okCount={okCount}
            />

            {/* Danh sách nguyên liệu */}
            {sorted.length === 0 ? (
              <div className="rounded-card border border-border bg-card px-6 py-16 text-center">
                <BrainCircuit className="mx-auto mb-3 h-10 w-10 text-text-secondary opacity-40" />
                <p className="font-semibold text-text-primary">Dữ liệu đang được chuẩn bị</p>
                <p className="mt-1 text-sm text-text-secondary">
                  AI sẽ cập nhật dự báo lúc 00:30 hàng đêm
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pagedIngredients.map((ingredient) => (
                    <button
                      key={ingredient.ingredient_id}
                      type="button"
                      className="text-left"
                      onClick={() => setSelectedIngredient(ingredient)}
                    >
                      <IngredientCard ingredient={ingredient} />
                    </button>
                  ))}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-text-secondary">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length} nguyên liệu
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[4rem] text-center text-sm font-medium text-text-primary">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab Lịch sử train ── */}
        <TabsContent value="history">
          <div className="pt-4">
            <TrainLogsPanel branchId={branchId} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheet chi tiết tiêu thụ từng ngày — ngoài tabs vì là modal */}
      <IngredientDetailSheet
        ingredient={selectedIngredient}
        weatherForecast={data?.weather_forecast ?? []}
        open={selectedIngredient !== null}
        onOpenChange={(open) => { if (!open) setSelectedIngredient(null); }}
      />
    </div>
  );
};
