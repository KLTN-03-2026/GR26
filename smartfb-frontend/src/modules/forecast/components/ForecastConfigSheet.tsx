import { useState, useEffect } from 'react';
import { Settings, Loader2, BrainCircuit, CalendarDays, RefreshCw, Database, CheckCircle2, XCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@shared/components/ui/sheet';
import { Switch } from '@shared/components/ui/switch';
import { useTrainConfig, useUpdateTrainConfig } from '../hooks/useForecast';

/**
 * Ngưỡng tối thiểu số ngày data theo kỳ dự báo.
 * Phải khớp với MIN_DAYS_BY_FORECAST trong BE train_service.py.
 */
const MIN_DAYS_BY_FORECAST: Record<number, number> = {
  7:  90,
  14: 150,
  21: 180,
};

/** Preset số ngày dự báo — tương ứng với n_forecasts trong NeuralProphet config */
const FORECAST_PERIOD_OPTIONS = [
  { value: 7,  label: '7 ngày',  sub: 'Ngắn hạn', desc: 'Chính xác nhất' },
  { value: 14, label: '14 ngày', sub: 'Trung hạn', desc: 'Cân bằng' },
  { value: 21, label: '21 ngày', sub: 'Dài hạn',   desc: 'Lên kế hoạch' },
] as const;


interface ForecastConfigSheetProps {
  branchId: string;
}

/**
 * Sheet cài đặt tham số dự báo AI cho chi nhánh.
 * Chỉ OWNER thấy — AI Service tự kiểm tra role khi gọi PUT /train/config.
 * Sau khi lưu, AI Service tự động queue retrain trong nền.
 */
export const ForecastConfigSheet = ({ branchId }: ForecastConfigSheetProps) => {
  const [open, setOpen] = useState(false);

  const { data: config, isLoading } = useTrainConfig(branchId);
  const updateConfig = useUpdateTrainConfig(branchId);

  // Form state — khởi tạo từ config hiện tại khi sheet mở
  const [nForecasts, setNForecasts] = useState<7 | 14 | 21>(7);
  const [weeklySeasonality, setWeeklySeasonality] = useState(true);

  // Đồng bộ form khi có data từ API
  useEffect(() => {
    if (!config) return;
    const validPeriod = [7, 14, 21].includes(config.n_forecasts)
      ? (config.n_forecasts as 7 | 14 | 21)
      : 7;
    setNForecasts(validPeriod);
    setWeeklySeasonality(config.weekly_seasonality);
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate(
      {
        start_date: config?.start_date ?? null,
        n_forecasts: nForecasts,
        epochs: config?.epochs ?? 100,
        weekly_seasonality: weeklySeasonality,
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu cài đặt — AI đang retrain trong nền');
          setOpen(false);
        },
        onError: () => {
          toast.error('Lưu cài đặt thất bại. Vui lòng thử lại.');
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-slate-50"
      >
        <Settings className="h-4 w-4 text-text-secondary" />
        Cài đặt dự báo
      </button>

      <SheetContent className="flex h-full w-full flex-col bg-white overflow-hidden sm:max-w-md p-0">
        {/* ── Header ───────────────────────────────────────── */}
        <SheetHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Cài đặt dự báo AI</SheetTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Thay đổi sẽ trigger retrain model tự động
              </p>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-text-secondary">Đang tải cài đặt...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* ── Dữ liệu huấn luyện ─────────────────────────── */}
            {config && (
              <div className="px-5 py-5 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-text-secondary" />
                  <p className="text-sm font-semibold text-text-primary">Dữ liệu huấn luyện</p>
                </div>
                <p className="text-xs text-text-secondary mb-3 ml-6">
                  Càng nhiều ngày data, AI dự báo càng xa và chính xác hơn.
                </p>

                {/* Thanh tiến trình với milestone markers */}
                <div className="relative mt-1">
                  {/* Track */}
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        config.active_days >= 180
                          ? 'bg-emerald-500'
                          : config.active_days >= 150
                            ? 'bg-blue-500'
                            : config.active_days >= 90
                              ? 'bg-amber-500'
                              : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.min((config.active_days / 180) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Milestone markers */}
                  {[
                    { days: 90,  label: '90', pct: (90 / 180) * 100 },
                    { days: 150, label: '150', pct: (150 / 180) * 100 },
                  ].map((m) => (
                    <div
                      key={m.days}
                      className="absolute top-0 flex flex-col items-center"
                      style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`h-2.5 w-0.5 ${config.active_days >= m.days ? 'bg-white/60' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                </div>

                {/* Labels dưới thanh */}
                <div className="relative mt-1.5 h-7">
                  <span className="absolute left-0 text-[10px] text-text-secondary">0</span>
                  {[
                    { days: 90,  pct: (90 / 180) * 100 },
                    { days: 150, pct: (150 / 180) * 100 },
                  ].map((m) => (
                    <span
                      key={m.days}
                      className={`absolute text-[10px] font-medium ${config.active_days >= m.days ? 'text-emerald-600' : 'text-slate-400'}`}
                      style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
                    >
                      {m.days}
                    </span>
                  ))}
                  <span className="absolute right-0 text-[10px] text-text-secondary">180+</span>
                </div>

                {/* Số ngày hiện tại */}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Hiện có</span>
                  <span className={`text-sm font-bold ${
                    config.active_days >= 180
                      ? 'text-emerald-600'
                      : config.active_days >= 90
                        ? 'text-amber-600'
                        : 'text-red-500'
                  }`}>
                    {config.active_days} ngày có đơn hàng
                  </span>
                </div>
              </div>
            )}

            {/* ── Kỳ dự báo ──────────────────────────────────── */}
            <div className="px-5 py-5 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-4 w-4 text-text-secondary" />
                <p className="text-sm font-semibold text-text-primary">Kỳ dự báo</p>
              </div>
              <p className="text-xs text-text-secondary mb-3 ml-6">
                Số ngày AI dự báo tiêu thụ cho mỗi nguyên liệu.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {FORECAST_PERIOD_OPTIONS.map((opt) => {
                  const minDays = MIN_DAYS_BY_FORECAST[opt.value] ?? 90;
                  const disabled = (config?.active_days ?? 0) < minDays;
                  const active = nForecasts === opt.value && !disabled;
                  const shortage = minDays - (config?.active_days ?? 0);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setNForecasts(opt.value)}
                      className={`relative flex flex-col items-center rounded-xl border py-3.5 px-2 text-center transition-all ${
                        disabled
                          ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                          : active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border bg-slate-50 hover:border-primary/40 hover:bg-white'
                      }`}
                    >
                      {disabled && (
                        <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-slate-400" />
                      )}
                      <span className={`text-lg font-bold leading-none ${
                        disabled ? 'text-slate-400' : active ? 'text-primary' : 'text-text-primary'
                      }`}>
                        {opt.value}
                      </span>
                      <span className={`text-[10px] font-medium mt-1 ${
                        disabled ? 'text-slate-400' : active ? 'text-primary' : 'text-text-secondary'
                      }`}>
                        {opt.sub}
                      </span>
                      {disabled ? (
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Cần thêm {shortage} ngày
                        </span>
                      ) : (
                        <span className="text-[9px] text-text-secondary mt-0.5">{opt.desc}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>


            {/* ── Pattern cuối tuần ──────────────────────────── */}
            <div className="px-5 py-5 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 text-text-secondary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Pattern cuối tuần</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Bật nếu quán có lượng khách khác nhau vào cuối tuần (T7, CN).
                    </p>
                  </div>
                </div>
                <Switch checked={weeklySeasonality} onCheckedChange={setWeeklySeasonality} />
              </div>
            </div>

            {/* ── Thông tin hệ thống (readonly) ──────────────── */}
            {config && (
              <div className="px-5 py-5 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-text-secondary" />
                  <p className="text-sm font-semibold text-text-primary">Thông tin hệ thống</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-text-secondary">Ngày nhìn lại</span>
                    <span className="text-xs font-semibold text-text-primary">{config.n_lags_auto} ngày (auto)</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-text-secondary">Mùa vụ theo năm</span>
                    <span className={`text-xs font-semibold ${config.yearly_seasonality_auto ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {config.yearly_seasonality_auto ? 'Bật' : 'Tắt (chưa đủ data)'}
                    </span>
                  </div>
                  {config.last_order_date && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-text-secondary">Đơn gần nhất</span>
                      <span className="text-xs font-semibold text-text-primary">
                        {format(parseISO(config.last_order_date), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-text-secondary">Trạng thái model</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.model_exists ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {config.model_exists
                        ? <><CheckCircle2 className="h-3.5 w-3.5" />Đã train</>
                        : <><XCircle className="h-3.5 w-3.5" />Chưa train</>
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Nút lưu ───────────────────────────────────── */}
            <div className="px-5 py-5">
              <Button
                className="w-full h-11 text-sm font-semibold"
                onClick={handleSave}
                disabled={updateConfig.isPending}
              >
                {updateConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Lưu & Retrain model
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-[10px] text-text-secondary">
                Model sẽ được retrain tự động trong nền sau khi lưu
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
