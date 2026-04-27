import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { forecastService } from '../services/forecastService';
import type { TrainConfigUpdatePayload } from '../types';

/**
 * Lấy dự báo tồn kho 7 ngày tới cho chi nhánh hiện tại.
 * Cache 5 phút vì AI predict chạy mỗi đêm — không cần refetch liên tục.
 */
export const useForecast = (branchId?: string) => {
  // Ưu tiên branchId truyền vào, fallback về chi nhánh của user hiện tại.
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const resolvedBranchId = branchId ?? currentBranchId ?? '';

  return useQuery({
    queryKey: queryKeys.forecast.detail(resolvedBranchId),
    queryFn: () => forecastService.getForecast(resolvedBranchId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!resolvedBranchId,
  });
};

/**
 * Lấy tóm tắt số nguyên liệu theo mức độ khẩn cấp (critical/warning/ok).
 * Dùng cho summary bar — nhẹ hơn getForecast vì không chứa danh sách nguyên liệu.
 */
export const useForecastSummary = (branchId?: string) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const resolvedBranchId = branchId ?? currentBranchId ?? '';

  return useQuery({
    queryKey: queryKeys.forecast.summary(resolvedBranchId),
    queryFn: () => forecastService.getForecastSummary(resolvedBranchId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!resolvedBranchId,
  });
};

/**
 * Lấy dự báo chi tiết cho một nguyên liệu cụ thể.
 */
export const useIngredientForecast = (branchId: string, ingredientId: string) => {
  return useQuery({
    queryKey: queryKeys.forecast.ingredient(branchId, ingredientId),
    queryFn: () => forecastService.getIngredientForecast(branchId, ingredientId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!branchId && !!ingredientId,
  });
};

/**
 * Lấy trạng thái train model (thời điểm train, kết quả, số series).
 * Dùng để hiển thị thông tin độ tin cậy dự báo và badge "Cập nhật lúc...".
 */
export const useTrainStatus = (branchId?: string) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const resolvedBranchId = branchId ?? currentBranchId ?? '';

  return useQuery({
    queryKey: queryKeys.forecast.trainStatus(resolvedBranchId),
    queryFn: () => forecastService.getTrainStatus(resolvedBranchId),
    retry: 1,
    enabled: !!resolvedBranchId,
  });
};

/**
 * Kích hoạt train model thủ công.
 * Sau khi train xong, invalidate trainStatus để component cập nhật trạng thái mới.
 */
export const useTriggerTrain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => forecastService.triggerTrain(),
    onSuccess: () => {
      // Reload train status của tất cả chi nhánh để phản ánh lần train mới nhất.
      queryClient.invalidateQueries({ queryKey: ['ai-forecast', 'train-status'] });
    },
  });
};

/**
 * Trigger predict thủ công cho 1 chi nhánh — dùng model đã train sẵn, nhanh hơn train.
 * Sau 5 giây (để background job kịp hoàn thành), invalidate forecast để FE tự reload.
 */
export const useTriggerPredict = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => forecastService.triggerPredict(branchId),
    onSuccess: () => {
      // Đợi 5 giây cho background predict job hoàn thành rồi mới reload forecast.
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.forecast.detail(branchId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.forecast.summary(branchId) });
      }, 5000);
    },
  });
};

/**
 * Lấy lịch sử các lần train gần nhất của chi nhánh.
 * Dùng để hiển thị trong ForecastConfigSheet — MAPE, MAE, thời gian chạy.
 */
export const useTrainLogs = (branchId: string, limit = 5) => {
  return useQuery({
    queryKey: queryKeys.forecast.trainLogs(branchId, limit),
    queryFn: () => forecastService.getTrainLogs(branchId, limit),
    staleTime: 2 * 60 * 1000, // Cache 2 phút — train log ít thay đổi
    retry: 1,
    enabled: !!branchId,
  });
};

/**
 * Đọc config train hiện tại của chi nhánh.
 * Bao gồm n_forecasts, epochs, weekly_seasonality và thống kê active_days để check ngưỡng 90 ngày.
 */
export const useTrainConfig = (branchId?: string) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const resolvedBranchId = branchId ?? currentBranchId ?? '';

  return useQuery({
    queryKey: queryKeys.forecast.config(resolvedBranchId),
    queryFn: () => forecastService.getTrainConfig(resolvedBranchId),
    staleTime: 10 * 60 * 1000, // Config ít thay đổi — cache 10 phút
    retry: 1,
    enabled: !!resolvedBranchId,
  });
};

/**
 * Cập nhật config train cho chi nhánh và trigger retrain tự động.
 * Sau khi save, invalidate cả config lẫn trainStatus để phản ánh trạng thái mới.
 */
export const useUpdateTrainConfig = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrainConfigUpdatePayload) =>
      forecastService.updateTrainConfig(branchId, payload),
    onSuccess: () => {
      // Reload config và status sau khi lưu + retrain được queue.
      queryClient.invalidateQueries({ queryKey: queryKeys.forecast.config(branchId) });
      queryClient.invalidateQueries({ queryKey: ['ai-forecast', 'train-status'] });
    },
  });
};
