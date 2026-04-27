import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROUTES } from '@shared/constants/routes';
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// AI Service chạy độc lập ở port 8001, khác hoàn toàn với BE Spring Boot (8080).
// Không dùng proxy Vite vì cần gọi trực tiếp qua VITE_AI_SERVICE_URL.
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

// Timeout cao hơn apiClient vì AI predict/train có thể chậm hơn BE.
const AI_TIMEOUT = 15000;

/**
 * Tạo axios client riêng cho AI Service.
 * Tách biệt hoàn toàn với axiosInstance của BE để tránh lẫn lộn baseURL và interceptor.
 */
const createAiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: AI_TIMEOUT,
  });
};

export const aiClient = createAiClient();

// Gắn JWT, tenantId, branchId theo đúng cách axiosInstance của BE đang làm.
// AI Service verify JWT từ Spring Boot nên phải dùng cùng token và header.
aiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { session, user } = useAuthStore.getState();
    const accessToken = session?.accessToken;
    const tenantId = session?.tenantId ?? user?.tenantId;
    const branchId = session?.branchId ?? user?.branchId;

    if (accessToken) {
      config.headers.Authorization = `${session?.tokenType ?? 'Bearer'} ${accessToken}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }

    if (branchId) {
      config.headers['X-Branch-Id'] = branchId;
    }

    return config;
  },
  (requestError) => Promise.reject(requestError)
);

aiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // AI Service không hỗ trợ refresh token — khi JWT hết hạn thì redirect thẳng về login.
    // Không lặp lại vòng refresh như axiosInstance của BE.
    if (status === 401 || status === 403) {
      useAuthStore.getState().clearAuthSession();
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = ROUTES.LOGIN;
      }

      return Promise.reject(error);
    }

    if (error.request && !error.response) {
      toast.error('Không thể kết nối đến AI Service. Kiểm tra kết nối mạng.');
    }

    return Promise.reject(error);
  }
);

export default aiClient;
