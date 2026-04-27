/** Thời tiết dự báo cho một ngày — từ Open-Meteo qua AI Service. */
export interface DayWeather {
  /** Ngày, định dạng "YYYY-MM-DD" */
  date: string;
  /** Nhiệt độ tối đa (°C) */
  temperature: number | null;
  /** Lượng mưa (mm) */
  precipitation: number | null;
}

/**
 * Config train NeuralProphet của một chi nhánh.
 * Đọc từ GET /api/v1/train/config?branch_id=...
 */
export interface TrainConfigData {
  branch_id: string;
  /** Lấy data từ ngày này. null = từ đơn đầu tiên */
  start_date: string | null;
  /** Số ngày dự báo (1–30). Preset: 7 / 14 / 21 */
  n_forecasts: number;
  /** Số vòng train (20–500). Cao hơn = chính xác hơn nhưng chậm hơn */
  epochs: number;
  /** Nhận dạng pattern cuối tuần */
  weekly_seasonality: boolean;
  /** Số ngày nhìn lại — hệ thống tự tính từ active_days (readonly) */
  n_lags_auto: number;
  /** Tự bật khi có ≥ 730 ngày data (readonly) */
  yearly_seasonality_auto: boolean;
  /** Số ngày chi nhánh có đơn hàng (dùng để check ngưỡng 90 ngày) */
  active_days: number;
  /** Ngày đơn hàng đầu tiên */
  first_order_date: string | null;
  /** Ngày đơn hàng gần nhất */
  last_order_date: string | null;
  /** File model đã tồn tại trên disk */
  model_exists: boolean;
}

/**
 * Payload gửi khi cập nhật config train.
 * PUT /api/v1/train/config?branch_id=...
 */
export interface TrainConfigUpdatePayload {
  start_date: string | null;
  n_forecasts: number;
  epochs: number;
  weekly_seasonality: boolean;
}

/**
 * Dự báo tiêu thụ cho một ngày cụ thể.
 * AI Service trả về theo từng ngày trong kỳ dự báo 7 ngày.
 */
export interface DayForecast {
  /** Ngày dự báo, định dạng "YYYY-MM-DD" */
  forecast_date: string;
  /** Lượng tiêu thụ dự báo (đơn vị theo nguyên liệu) */
  predicted_qty: number;
  /** Cận dưới khoảng tin cậy 80% (quantile 10%) — null với model cũ chưa retrain */
  lower_bound: number | null;
  /** Cận trên khoảng tin cậy 80% (quantile 90%) — null với model cũ chưa retrain */
  upper_bound: number | null;
}

/**
 * Dự báo tồn kho cho một nguyên liệu tại chi nhánh.
 * Bao gồm tồn kho hiện tại, ngày hết hàng dự kiến và gợi ý nhập.
 */
export interface IngredientForecast {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  /** Tồn kho hiện tại tại thời điểm chạy predict */
  current_stock: number;
  /** Dự báo 7 ngày tới */
  forecast_days: DayForecast[];
  /**
   * Ngày dự kiến hết hàng, định dạng "YYYY-MM-DD".
   * null = tồn kho đủ trong toàn bộ kỳ dự báo.
   */
  stockout_date: string | null;
  /** Số lượng gợi ý nhập thêm để đủ hàng */
  suggested_order_qty: number;
  /** Ngày nên đặt hàng để nhận kịp trước khi hết, định dạng "YYYY-MM-DD" */
  suggested_order_date: string;
  /** Mức độ khẩn cấp nhập hàng */
  urgency: 'ok' | 'warning' | 'critical';
  /** true = dùng dự báo tạm thời (fallback) do chưa đủ data train model */
  is_fallback: boolean;
}

/**
 * Response đầy đủ từ GET /api/v1/forecast/{branchId}.
 * AI Service trả raw JSON, không có wrapper ApiResponse.
 */
export interface ForecastResponse {
  branch_id: string;
  branch_name: string;
  branch_address: string | null;
  /** Thời điểm tạo dự báo, ISO 8601 */
  generated_at: string;
  /** Thời điểm train model gần nhất, null nếu chưa train lần nào */
  last_trained_at: string | null;
  /** Thời tiết từng ngày trong kỳ dự báo — từ Open-Meteo */
  weather_forecast: DayWeather[];
  ingredients: IngredientForecast[];
}

/**
 * Tóm tắt trạng thái tồn kho theo mức độ khẩn cấp cho một chi nhánh.
 * Dùng để hiển thị summary bar trên trang dự báo.
 */
export interface ForecastSummary {
  branch_id: string;
  /** Số nguyên liệu cần nhập ngay (urgency = "critical") */
  urgent_count: number;
  /** Số nguyên liệu sắp hết (urgency = "warning") */
  warning_count: number;
  /** Số nguyên liệu đủ hàng (urgency = "ok") */
  ok_count: number;
  total_ingredients: number;
  generated_at: string;
}

/**
 * Trạng thái train model của một chi nhánh.
 * Dùng để hiển thị thông tin độ tin cậy và thời điểm cập nhật dự báo.
 */
export interface TrainStatus {
  branch_id: string;
  /** Thời điểm train gần nhất, null nếu chưa từng train */
  last_trained_at: string | null;
  /** Kết quả train gần nhất: "success" | "failed" | null */
  status: string | null;
  /** Số series đã train (số cặp nguyên liệu × chi nhánh) */
  series_count: number | null;
  /** true = file model đã tồn tại trên disk, có thể dùng để predict */
  model_exists: boolean;
}

/**
 * Thông tin 1 lần chạy train — từ GET /train/logs.
 */
export interface TrainLogItem {
  id: number;
  branch_id: string | null;
  started_at: string;
  finished_at: string | null;
  /** running | success | failed */
  status: string;
  /** scheduled | manual */
  trigger_type: string;
  series_count: number | null;
  mae: number | null;
  /** MAPE % — dễ hiểu hơn MAE cho chủ quán */
  mape: number | null;
  error_message: string | null;
  /** Thời gian chạy (giây), null nếu chưa kết thúc */
  duration_seconds: number | null;
}

/**
 * Response từ GET /train/logs.
 */
export interface TrainLogsResponse {
  tenant_id: string;
  branch_id: string | null;
  logs: TrainLogItem[];
  total: number;
}
