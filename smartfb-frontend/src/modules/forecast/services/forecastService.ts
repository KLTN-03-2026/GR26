import { aiClient } from '@lib/aiClient';
import type {
  ForecastResponse,
  ForecastSummary,
  IngredientForecast,
  TrainConfigData,
  TrainConfigUpdatePayload,
  TrainLogsResponse,
  TrainStatus,
} from '../types';

/**
 * Service gọi AI Service (port 8001) cho các tính năng dự báo tồn kho.
 *
 * QUAN TRỌNG: AI Service trả raw JSON, không có wrapper { success, data, message }.
 * → Lấy trực tiếp response.data (không phải response.data.data như BE Spring Boot).
 */
export const forecastService = {
  /**
   * Lấy dự báo tồn kho 7 ngày tới cho toàn bộ nguyên liệu của một chi nhánh.
   * Endpoint chỉ đọc từ bảng forecast_results — không chạy model realtime.
   *
   * GET /api/v1/forecast/{branchId}
   */
  getForecast: async (branchId: string): Promise<ForecastResponse> => {
    const response = await aiClient.get<ForecastResponse>(`/api/v1/forecast/${branchId}`);
    return response.data;
  },

  /**
   * Lấy tóm tắt số lượng nguyên liệu theo mức độ khẩn cấp cho chi nhánh.
   * Dùng để hiển thị summary bar mà không cần load toàn bộ danh sách nguyên liệu.
   *
   * GET /api/v1/forecast/{branchId}/summary
   */
  getForecastSummary: async (branchId: string): Promise<ForecastSummary> => {
    const response = await aiClient.get<ForecastSummary>(`/api/v1/forecast/${branchId}/summary`);
    return response.data;
  },

  /**
   * Lấy dự báo chi tiết cho một nguyên liệu cụ thể tại chi nhánh.
   *
   * GET /api/v1/forecast/{branchId}/{ingredientId}
   */
  getIngredientForecast: async (
    branchId: string,
    ingredientId: string,
  ): Promise<IngredientForecast> => {
    const response = await aiClient.get<IngredientForecast>(
      `/api/v1/forecast/${branchId}/${ingredientId}`,
    );
    return response.data;
  },

  /**
   * Kích hoạt train model thủ công cho toàn bộ tenant.
   * Thường được trigger bởi cron hàng tuần, hàm này dành cho admin/debug.
   *
   * POST /api/v1/train/trigger
   */
  triggerTrain: async (): Promise<void> => {
    await aiClient.post('/api/v1/train/trigger');
  },

  /**
   * Lấy trạng thái train model của chi nhánh:
   * thời điểm train gần nhất, kết quả và số series đã train.
   *
   * GET /api/v1/train/status?branch_id={branchId}
   */
  getTrainStatus: async (branchId: string): Promise<TrainStatus> => {
    const response = await aiClient.get<TrainStatus>('/api/v1/train/status', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  /**
   * Đọc config train NeuralProphet hiện tại của chi nhánh.
   * Bao gồm số ngày dự báo, epochs, weekly_seasonality và thống kê data thực tế.
   *
   * GET /api/v1/train/config?branch_id={branchId}
   */
  getTrainConfig: async (branchId: string): Promise<TrainConfigData> => {
    const response = await aiClient.get<TrainConfigData>('/api/v1/train/config', {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  /**
   * Cập nhật config train cho chi nhánh và trigger retrain ngay lập tức.
   * Chỉ OWNER mới được gọi endpoint này (AI Service tự kiểm tra role).
   *
   * PUT /api/v1/train/config?branch_id={branchId}
   */
  updateTrainConfig: async (
    branchId: string,
    payload: TrainConfigUpdatePayload,
  ): Promise<TrainConfigData> => {
    const response = await aiClient.put<TrainConfigData>('/api/v1/train/config', payload, {
      params: { branch_id: branchId },
    });
    return response.data;
  },

  /**
   * Trigger predict thủ công cho 1 chi nhánh cụ thể.
   * Dùng model đã train — nhanh hơn train, chạy background.
   * Kết quả forecast sẽ được cập nhật sau vài giây.
   *
   * POST /api/v1/train/predict?branch_id={branchId}
   */
  triggerPredict: async (branchId: string): Promise<void> => {
    await aiClient.post('/api/v1/train/predict', null, {
      params: { branch_id: branchId },
    });
  },

  /**
   * Lấy lịch sử các lần train gần nhất của chi nhánh.
   * Bao gồm status, MAE, MAPE, thời gian chạy và trigger type.
   *
   * GET /api/v1/train/logs?branch_id={branchId}&limit={limit}
   */
  getTrainLogs: async (branchId: string, limit = 5): Promise<TrainLogsResponse> => {
    const response = await aiClient.get<TrainLogsResponse>('/api/v1/train/logs', {
      params: { branch_id: branchId, limit },
    });
    return response.data;
  },
};
