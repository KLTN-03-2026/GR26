import { useAuthStore } from '@modules/auth/stores/authStore';
import type { AuthResponseContext, BackendAuthResponse } from '@modules/auth/types/auth.types';
import { ROUTES } from '@shared/constants/routes';
import type { ApiResponse } from '@shared/types/api.types';
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_TIMEOUT = 30000;

let refreshRequestPromise: Promise<BackendAuthResponse> | null = null;

/**
 * Tạo axios client với cấu hình base dùng chung cho toàn app.
 *
 * @returns Axios instance đã gắn baseURL, timeout và content-type mặc định
 */
const createApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Client cho các request public hoặc request không nên dính auth interceptor.
 */
export const publicAxiosInstance = createApiClient();

/**
 * Client chính cho request nghiệp vụ có auth.
 */
export const axiosInstance = createApiClient();

/**
 * Chỉ cho phép retry bằng refresh token với các request nghiệp vụ thông thường.
 * Các endpoint đăng nhập/refresh phải giữ nguyên luồng lỗi gốc để tránh lặp vô hạn.
 *
 * @param requestUrl - URL của request đang bị lỗi
 * @returns `true` nếu request có thể chạy lại sau khi refresh token
 */
const isRefreshableRequest = (requestUrl?: string): boolean => {
  if (!requestUrl) {
    return false;
  }

  return !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/refresh');
};

/**
 * Gọi endpoint refresh token và đồng bộ lại auth session trong store.
 *
 * @returns Session mới do backend trả về sau khi refresh thành công
 */
const requestRefreshToken = async (): Promise<BackendAuthResponse> => {
  const { session, user, setAuthSession } = useAuthStore.getState();
  const refreshToken = session?.refreshToken;

  // Ưu tiên refresh token đang có trong store.
  // Khi backend chuyển sang HttpOnly cookie thì payload có thể rỗng,
  // browser sẽ tự gửi cookie nếu `withCredentials` được bật.
  const payload = refreshToken ? { refreshToken } : {};
  const authContext: AuthResponseContext = {
    email: user?.email,
    fullName: user?.fullName,
    phone: user?.phone,
  };

  const response = await publicAxiosInstance.post<ApiResponse<BackendAuthResponse>>(
    '/auth/refresh',
    payload,
    {
      withCredentials: !refreshToken,
    }
  );

  setAuthSession(response.data.data, authContext);
  return response.data.data;
};

/**
 * Đảm bảo tại một thời điểm chỉ có một request refresh token đang chạy.
 *
 * @returns Session mới từ request refresh đang chạy hoặc vừa được tạo
 */
const refreshAccessToken = async (): Promise<BackendAuthResponse> => {
  if (!refreshRequestPromise) {
    refreshRequestPromise = requestRefreshToken().finally(() => {
      refreshRequestPromise = null;
    });
  }

  return refreshRequestPromise;
};

/**
 * Trích xuất message lỗi theo đúng contract `ApiResponse` của backend.
 *
 * @param responseData - response lỗi trả về từ backend
 * @returns Message lỗi ưu tiên từ `error.message`
 */
const getApiErrorMessage = (responseData?: ApiResponse<unknown>): string | undefined => {
  return responseData?.error?.message ?? responseData?.message;
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { session, user } = useAuthStore.getState();
    const accessToken = session?.accessToken;
    const tenantId = session?.tenantId ?? user?.tenantId;

    if (accessToken) {
      config.headers.Authorization = `${session?.tokenType ?? 'Bearer'} ${accessToken}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }

    return config;
  },
  (requestError) => Promise.reject(requestError)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      isRefreshableRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const refreshedSession = await refreshAccessToken();

        originalRequest.headers.Authorization =
          `${refreshedSession.tokenType} ${refreshedSession.accessToken}`;
        originalRequest.headers['X-Tenant-Id'] = refreshedSession.tenantId;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuthSession();
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN;
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const status = error.response.status;
      const backendMessage = getApiErrorMessage(error.response.data);

      switch (status) {
        case 400:
          toast.error(backendMessage || 'Dữ liệu gửi lên không hợp lệ');
          break;
        case 403:
          toast.error(backendMessage || 'Bạn không có quyền thực hiện thao tác này');
          break;
        case 404:
          toast.error(backendMessage || 'Không tìm thấy dữ liệu yêu cầu');
          break;
        case 409:
          toast.error(backendMessage || 'Dữ liệu đã tồn tại hoặc xung đột');
          break;
        case 500:
          toast.error(backendMessage || 'Lỗi hệ thống. Vui lòng thử lại sau.');
          break;
        case 503:
          toast.error(backendMessage || 'Dịch vụ tạm thời không khả dụng');
          break;
        default:
          if (status >= 500) {
            toast.error(backendMessage || 'Lỗi server. Vui lòng thử lại sau.');
          }
      }
    } else if (error.request) {
      toast.error('Không thể kết nối đến server. Kiểm tra kết nối mạng.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
