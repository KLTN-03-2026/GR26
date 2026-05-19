# FE gọi AI Service trực tiếp (bỏ qua BE proxy)

**Ngày:** 2026-04-23
**Mục tiêu:** FE gọi thẳng AI Service (port 8001) thay vì FE → BE → AI

---

## Bối cảnh

Trước đây: `FE → BE (Spring Boot :8080) → AI Service (:8001)`
Kiến trúc mới: `FE → AI Service (:8001)` trực tiếp

Module `forecast` phía BE đã được **xoá hoàn toàn**. AI Service dùng JWT token do Spring Boot phát — cùng secret key, FE chỉ cần forward token như bình thường.

---

## AI Service Endpoints cần tích hợp

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/api/v1/forecast/{branch_id}` | Full forecast 7 ngày cho chi nhánh |
| `GET` | `/api/v1/forecast/{branch_id}/summary` | Tổng quan urgency (critical/warning/ok) |
| `GET` | `/api/v1/forecast/{branch_id}/{ingredient_id}` | Dự báo 1 nguyên liệu cụ thể |
| `GET` | `/api/v1/train/status?branch_id=` | Trạng thái train + độ tin cậy model |
| `POST` | `/api/v1/train/trigger` | Trigger train thủ công (OWNER/ADMIN) |
| `PUT` | `/api/v1/train/config?branch_id=` | Cập nhật config train + retrain |

---

## Checklist triển khai

### 1. Env & axios client
- [ ] Thêm `VITE_AI_SERVICE_URL=http://localhost:8001` vào `.env`, `.env.example`, `.env.development`
- [ ] Tạo `src/lib/aiAxios.ts` — axios instance mới trỏ tới `VITE_AI_SERVICE_URL`
  - Dùng lại interceptor auth token (Bearer JWT) từ `authStore`
  - Dùng lại interceptor response lỗi (toast) — copy pattern từ `axios.ts`
  - **Không** dùng chung `axiosInstance` của BE vì baseURL khác

### 2. Types
- [ ] Tạo `src/modules/forecast/types/forecast.types.ts`

```typescript
export interface DayForecast {
  forecast_date: string;   // "2026-04-24"
  predicted_qty: number;
}

export interface DayWeather {
  date: string;
  temperature: number | null;
  precipitation: number | null;
}

export interface IngredientForecast {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  current_stock: number;
  forecast_days: DayForecast[];
  stockout_date: string | null;
  suggested_order_qty: number;
  suggested_order_date: string | null;
  urgency: 'ok' | 'warning' | 'critical';
  is_fallback: boolean;
}

export interface ForecastResponse {
  branch_id: string;
  branch_name: string;
  branch_address: string | null;
  generated_at: string;
  last_trained_at: string | null;
  weather_forecast: DayWeather[];
  ingredients: IngredientForecast[];
}

export interface ForecastSummary {
  branch_id: string;
  generated_at: string;
  urgent_count: number;
  warning_count: number;
  ok_count: number;
  total_ingredients: number;
  urgent_items: IngredientSummaryItem[];
  warning_items: IngredientSummaryItem[];
}

export interface IngredientSummaryItem {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  stockout_date: string | null;
}

export interface TrainStatusResponse {
  tenant_id: string;
  last_trained_at: string | null;
  status: 'running' | 'success' | 'failed' | null;
  series_count: number | null;
  mae: number | null;
  mape: number | null;
  model_exists: boolean;
}
```

### 3. Services
- [ ] Tạo `src/modules/forecast/services/forecastService.ts`

```typescript
import { aiAxiosInstance } from '@lib/aiAxios';
import type { ForecastResponse, ForecastSummary, IngredientForecast } from '../types/forecast.types';

export const forecastService = {
  getForecast: (branchId: string) =>
    aiAxiosInstance.get<ForecastResponse>(`/api/v1/forecast/${branchId}`),

  getSummary: (branchId: string) =>
    aiAxiosInstance.get<ForecastSummary>(`/api/v1/forecast/${branchId}/summary`),

  getIngredientForecast: (branchId: string, ingredientId: string) =>
    aiAxiosInstance.get<IngredientForecast>(`/api/v1/forecast/${branchId}/${ingredientId}`),
};
```

- [ ] Tạo `src/modules/forecast/services/trainService.ts`

```typescript
import { aiAxiosInstance } from '@lib/aiAxios';
import type { TrainStatusResponse } from '../types/forecast.types';

export const trainService = {
  getStatus: (branchId?: string) =>
    aiAxiosInstance.get<TrainStatusResponse>('/api/v1/train/status', {
      params: branchId ? { branch_id: branchId } : undefined,
    }),

  triggerTrain: () =>
    aiAxiosInstance.post('/api/v1/train/trigger'),
};
```

### 4. Hooks (TanStack Query)
- [ ] `src/modules/forecast/hooks/useForecast.ts` — `useQuery` gọi `getForecast`, staleTime 5 phút
- [ ] `src/modules/forecast/hooks/useForecastSummary.ts` — `useQuery` gọi `getSummary`, staleTime 5 phút
- [ ] `src/modules/forecast/hooks/useTrainStatus.ts` — `useQuery` gọi `getStatus`
- [ ] `src/modules/forecast/hooks/useTriggerTrain.ts` — `useMutation` gọi `triggerTrain`, invalidate train status sau khi thành công

### 5. Components
- [ ] `src/modules/forecast/components/ForecastSummaryCards.tsx`
  - Hiển thị 3 card: `critical` (đỏ) / `warning` (vàng) / `ok` (xanh)
  - Dữ liệu từ `useForecastSummary`

- [ ] `src/modules/forecast/components/IngredientForecastCard.tsx`
  - 1 card cho 1 nguyên liệu
  - Hiển thị: tên, tồn kho hiện tại, bar chart 7 ngày, ngày hết hàng, gợi ý nhập
  - Badge urgency: `critical`=đỏ / `warning`=vàng / `ok`=xanh

- [ ] `src/modules/forecast/components/WeatherWidget.tsx` (optional)
  - Hiển thị thời tiết 7 ngày kèm forecast (nhiệt độ + lượng mưa)

- [ ] `src/modules/forecast/components/TrainStatusBanner.tsx`
  - Hiển thị lần train gần nhất + nút "Train lại" (OWNER/ADMIN)
  - Dựa vào `useTrainStatus` và `useTriggerTrain`

- [ ] `src/modules/forecast/components/ForecastDashboard.tsx`
  - Container chính: ghép `TrainStatusBanner` + `ForecastSummaryCards` + list `IngredientForecastCard`
  - Dùng `useForecast` lấy toàn bộ data

### 6. Page & routing
- [ ] Tạo page `src/pages/forecast/index.tsx` (hoặc theo cấu trúc routing hiện tại)
- [ ] Thêm route vào sidebar / router config
- [ ] Phân quyền: OWNER + MANAGER có thể xem; OWNER + ADMIN có thể trigger train

---

## Notes kỹ thuật

### CORS
AI Service cần thêm FE origin vào allowed origins. Kiểm tra `app/core/config.py`:
```python
CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
```

### Cache
AI Service trả header `Cache-Control: max-age=300` cho `/forecast/{branch_id}`.
FE dùng `staleTime: 5 * 60 * 1000` trong TanStack Query để khớp.

### Lỗi khi AI Service offline
Bọc component trong ErrorBoundary hoặc handle trong hook:
- 503/network error → hiển thị banner "AI Service đang khởi động, thử lại sau"
- 404 → hiển thị "Chưa có dữ liệu dự báo. Hệ thống sẽ cập nhật vào đêm nay."

### branchId
FE đã có `branchId` trong `authStore` (session.branchId). Truyền thẳng vào hooks.
