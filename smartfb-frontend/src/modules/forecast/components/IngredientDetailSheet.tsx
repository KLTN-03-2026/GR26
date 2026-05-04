import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PackageCheck, ShoppingCart, CalendarClock, CloudRain, Sun, Cloud, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@shared/components/ui/sheet';
import type { IngredientForecast, DayWeather } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RAIN_THRESHOLD_MM = 3;

const URGENCY_CONFIG = {
  critical: {
    label: 'Khẩn cấp',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    dotColor: '#ef4444',
    lineColor: '#ef4444',
    areaColor: '#fca5a5',
  },
  warning: {
    label: 'Sắp hết',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    dotColor: '#f97316',
    lineColor: '#f97316',
    areaColor: '#fed7aa',
  },
  ok: {
    label: 'Đủ hàng',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    dotColor: '#10b981',
    lineColor: '#10b981',
    areaColor: '#a7f3d0',
  },
} as const;

/** Icon thời tiết nhỏ gọn dùng trong tooltip */
const weatherIcon = (day: DayWeather | undefined) => {
  if (!day) return null;
  if (day.precipitation !== null && day.precipitation >= RAIN_THRESHOLD_MM) return '🌧';
  if (day.temperature !== null && day.temperature >= 30) return '☀️';
  return '⛅';
};

// ─── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipPayload {
  payload: {
    forecast_date: string;
    predicted_qty: number;
    lower_bound: number | null;
    upper_bound: number | null;
    weather?: DayWeather;
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  unit?: string;
}

const ChartTooltip = ({ active, payload, unit }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const dateLabel = format(parseISO(item.forecast_date), 'EEEE, dd/MM', { locale: vi });
  const icon = weatherIcon(item.weather);
  const hasInterval = item.lower_bound != null && item.upper_bound != null;

  return (
    <div className="rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-xl">
      <p className="text-[11px] font-medium text-text-secondary mb-1">
        {dateLabel} {icon}
      </p>
      <p className="text-base font-bold text-text-primary">
        {item.predicted_qty.toFixed(1)}{' '}
        <span className="text-xs font-normal text-text-secondary">{unit}</span>
      </p>
      {hasInterval && (
        <p className="text-[10px] text-text-secondary mt-0.5">
          Khoảng: {item.lower_bound!.toFixed(1)} – {item.upper_bound!.toFixed(1)} {unit}
        </p>
      )}
      {item.weather?.temperature != null && (
        <p className="text-[10px] text-text-secondary mt-0.5">
          {Math.round(item.weather.temperature)}°C
          {item.weather.precipitation != null && item.weather.precipitation > 0
            ? ` · ${item.weather.precipitation.toFixed(1)}mm mưa`
            : ''}
        </p>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

interface IngredientDetailSheetProps {
  ingredient: IngredientForecast | null;
  weatherForecast: DayWeather[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet hiển thị biểu đồ dự báo tiêu thụ hàng ngày của một nguyên liệu.
 * Hiển thị urgency badge, stat cards, AreaChart với gradient, thời tiết và gợi ý nhập hàng.
 */
export const IngredientDetailSheet = ({
  ingredient,
  weatherForecast,
  open,
  onOpenChange,
}: IngredientDetailSheetProps) => {
  if (!ingredient) return null;

  const today = new Date();
  const urgency = URGENCY_CONFIG[ingredient.urgency];

  // Merge weather vào forecast_days theo ngày
  const weatherByDate = new Map(weatherForecast.map((w) => [w.date, w]));
  const chartData = ingredient.forecast_days.map((day) => ({
    ...day,
    weather: weatherByDate.get(day.forecast_date),
  }));

  // Hiển thị confidence band chỉ khi model đã train với quantiles
  const hasConfidenceBand = chartData.some(
    (d) => d.lower_bound != null && d.upper_bound != null,
  );

  const daysUntilStockout = ingredient.stockout_date
    ? differenceInCalendarDays(parseISO(ingredient.stockout_date), today)
    : null;

  const totalForecastQty = ingredient.forecast_days.reduce((s, d) => s + d.predicted_qty, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col bg-white overflow-hidden sm:max-w-md p-0">
        {/* ── Header ───────────────────────────────────────── */}
        <SheetHeader className="shrink-0 px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${urgency.bg} ${urgency.border} ${urgency.text}`}
                >
                  {urgency.icon}
                  {urgency.label}
                </span>
                {ingredient.is_fallback && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    Dự báo tạm thời
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg leading-tight">{ingredient.ingredient_name}</SheetTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Dự báo {ingredient.forecast_days.length} ngày tới
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* ── Stat cards ───────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 px-5 py-4 border-b border-border">
            {/* Tồn kho */}
            <div className="flex flex-col items-center rounded-xl bg-slate-50 border border-slate-100 py-3 px-2 text-center">
              <PackageCheck className="h-4 w-4 text-slate-400 mb-1.5" />
              <p className="text-[10px] text-text-secondary leading-tight">Tồn kho</p>
              <p className="text-sm font-bold text-text-primary mt-0.5 leading-tight">
                {ingredient.current_stock}
              </p>
              <p className="text-[10px] text-text-secondary">{ingredient.unit}</p>
            </div>

            {/* Hết hàng sau */}
            <div className={`flex flex-col items-center rounded-xl border py-3 px-2 text-center ${ingredient.stockout_date ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <CalendarClock className={`h-4 w-4 mb-1.5 ${ingredient.stockout_date ? 'text-red-400' : 'text-emerald-400'}`} />
              <p className="text-[10px] text-text-secondary leading-tight">Hết sau</p>
              {ingredient.stockout_date && daysUntilStockout !== null ? (
                <>
                  <p className={`text-sm font-bold mt-0.5 leading-tight ${daysUntilStockout <= 0 ? 'text-red-600' : 'text-red-500'}`}>
                    {daysUntilStockout <= 0 ? 'Hôm nay' : `${daysUntilStockout} ngày`}
                  </p>
                  <p className="text-[10px] text-red-400">
                    {format(parseISO(ingredient.stockout_date), 'dd/MM', { locale: vi })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5 leading-tight">Đủ hàng</p>
                  <p className="text-[10px] text-emerald-400">7 ngày</p>
                </>
              )}
            </div>

            {/* Tiêu thụ dự báo */}
            <div className="flex flex-col items-center rounded-xl bg-slate-50 border border-slate-100 py-3 px-2 text-center">
              <TrendingDown className="h-4 w-4 text-slate-400 mb-1.5" />
              <p className="text-[10px] text-text-secondary leading-tight">Tiêu thụ</p>
              <p className="text-sm font-bold text-text-primary mt-0.5 leading-tight">
                {totalForecastQty.toFixed(0)}
              </p>
              <p className="text-[10px] text-text-secondary">{ingredient.unit}/7 ngày</p>
            </div>
          </div>

          {/* ── Biểu đồ ──────────────────────────────────────── */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Tiêu thụ dự báo
            </p>

            {chartData.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-slate-50">
                <p className="text-sm text-text-secondary">Không có dữ liệu dự báo</p>
              </div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 24, right: 8, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={urgency.areaColor} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={urgency.areaColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1ede9" vertical={false} />
                      <XAxis
                        dataKey="forecast_date"
                        tickFormatter={(v: string) => format(parseISO(v), 'dd/MM', { locale: vi })}
                        tick={{ fontSize: 10, fill: '#9c8b7a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e8ddd4' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9c8b7a' }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip unit={ingredient.unit} />} cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 }} />
                      {ingredient.stockout_date && (
                        <ReferenceLine
                          x={ingredient.stockout_date}
                          stroke="#ef4444"
                          strokeDasharray="4 3"
                          strokeWidth={1.5}
                          label={{ value: 'Hết hàng', position: 'top', fontSize: 9, fill: '#ef4444' }}
                        />
                      )}
                      {/* Confidence band — dashed lines khi model train với quantiles */}
                      {hasConfidenceBand && (
                        <>
                          <Area
                            type="monotone"
                            dataKey="upper_bound"
                            stroke={urgency.lineColor}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            strokeOpacity={0.35}
                            fill="none"
                            dot={false}
                            activeDot={false}
                            legendType="none"
                            isAnimationActive={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="lower_bound"
                            stroke={urgency.lineColor}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            strokeOpacity={0.35}
                            fill="none"
                            dot={false}
                            activeDot={false}
                            legendType="none"
                            isAnimationActive={false}
                          />
                        </>
                      )}

                      <Area
                        type="monotone"
                        dataKey="predicted_qty"
                        stroke={urgency.lineColor}
                        strokeWidth={2.5}
                        fill="url(#forecastGradient)"
                        dot={(props) => {
                          const { cx, cy, payload } = props as { cx?: number; cy?: number; payload: { forecast_date: string } };
                          if (cx == null || cy == null) return <></>;
                          const isAfterStockout =
                            ingredient.stockout_date && payload.forecast_date >= ingredient.stockout_date;
                          const color = isAfterStockout ? '#ef4444' : urgency.dotColor;
                          return (
                            <Dot
                              key={payload.forecast_date}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={color}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-secondary">
                  {ingredient.stockout_date && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: urgency.dotColor }} />
                        Còn hàng
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                        Sau ngày hết hàng
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-px w-4 border-t-2 border-dashed border-red-400" />
                        Mốc hết hàng
                      </span>
                    </>
                  )}
                  {hasConfidenceBand && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-px w-4 border-t border-dashed" style={{ borderColor: urgency.dotColor, opacity: 0.5 }} />
                      Khoảng tin cậy 80%
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Thời tiết ─────────────────────────────────────── */}
          {weatherForecast.length > 0 && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                Thời tiết dự báo
              </p>
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(weatherForecast.length, 7)}, minmax(0, 1fr))`,
                }}
              >
                {weatherForecast.slice(0, 7).map((w) => {
                  const isRain = w.precipitation !== null && w.precipitation >= RAIN_THRESHOLD_MM;
                  const isSun = !isRain && w.temperature !== null && w.temperature >= 30;
                  return (
                    <div
                      key={w.date}
                      className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 text-center border ${
                        isRain
                          ? 'bg-blue-50 border-blue-100'
                          : isSun
                            ? 'bg-amber-50 border-amber-100'
                            : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <span className="text-[9px] font-medium text-text-secondary">
                        {format(parseISO(w.date), 'dd/MM', { locale: vi })}
                      </span>
                      {isRain ? (
                        <CloudRain className="h-4 w-4 text-blue-500" />
                      ) : isSun ? (
                        <Sun className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Cloud className="h-4 w-4 text-slate-400" />
                      )}
                      {w.temperature != null && (
                        <span className="text-[10px] font-bold text-text-primary">
                          {Math.round(w.temperature)}°
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Gợi ý nhập hàng ──────────────────────────────── */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Gợi ý nhập hàng
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-primary">
                    {ingredient.suggested_order_qty} {ingredient.unit}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Đặt hàng trước{' '}
                    <span className="font-medium text-text-primary">
                      {format(parseISO(ingredient.suggested_order_date), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
