import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';
import { useForecast } from '../hooks/useForecast';
import type { DayWeather } from '../types';

/** Ngưỡng mưa (mm) để hiển thị icon mưa thay vì nắng */
const RAIN_THRESHOLD_MM = 3;

interface WeatherIconProps {
  precipitation: number | null;
  temperature: number | null;
  className?: string;
}

/**
 * Chọn icon thời tiết dựa theo lượng mưa và nhiệt độ.
 * Đơn giản hoá: chỉ dùng 3 trạng thái — mưa / mây / nắng.
 */
const WeatherIcon = ({ precipitation, temperature, className = 'h-5 w-5' }: WeatherIconProps) => {
  if (precipitation !== null && precipitation >= RAIN_THRESHOLD_MM) {
    return <CloudRain className={`${className} text-blue-500`} />;
  }
  if (temperature !== null && temperature >= 30) {
    return <Sun className={`${className} text-amber-400`} />;
  }
  return <Cloud className={`${className} text-slate-400`} />;
};

interface DayWeatherCardProps {
  day: DayWeather;
}

const DayWeatherCard = ({ day }: DayWeatherCardProps) => {
  const label = format(parseISO(day.date), 'EEE', { locale: vi });
  const dateLabel = format(parseISO(day.date), 'dd/MM', { locale: vi });
  const isRain = day.precipitation !== null && day.precipitation >= RAIN_THRESHOLD_MM;

  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-border bg-card px-3 py-2 text-center">
      <span className="text-[11px] font-medium uppercase text-text-secondary">{label}</span>
      <span className="text-[10px] text-text-secondary">{dateLabel}</span>
      <WeatherIcon precipitation={day.precipitation} temperature={day.temperature} />
      {day.temperature !== null ? (
        <span className="text-sm font-semibold text-text-primary">{Math.round(day.temperature)}°</span>
      ) : (
        <span className="text-sm text-text-secondary">—</span>
      )}
      {isRain && day.precipitation !== null && (
        <span className="text-[10px] text-blue-500">{day.precipitation.toFixed(1)} mm</span>
      )}
    </div>
  );
};

interface WeatherWidgetProps {
  branchId: string;
}

/**
 * Widget thời tiết 7 ngày tới cho dashboard.
 * Lấy dữ liệu từ weather_forecast trong ForecastResponse — cùng request với dự báo tồn kho.
 * Không hiển thị gì nếu AI Service chưa có dữ liệu thời tiết (cache rỗng).
 */
export const WeatherWidget = ({ branchId }: WeatherWidgetProps) => {
  const { data, isLoading } = useForecast(branchId);

  const weatherDays = data?.weather_forecast ?? [];

  // Không render widget nếu đang load hoặc không có data thời tiết
  if (isLoading || weatherDays.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-medium text-text-primary">
            Thời tiết {weatherDays.length} ngày tới
          </h3>
        </div>
        <span className="text-xs text-text-secondary">{data?.branch_name}</span>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${weatherDays.length}, minmax(0, 1fr))` }}>
        {weatherDays.map((day) => (
          <DayWeatherCard key={day.date} day={day} />
        ))}
      </div>

      <p className="mt-2 text-[10px] text-text-secondary">
        Nguồn: Open-Meteo · Dự báo có thể thay đổi
      </p>
    </div>
  );
};
