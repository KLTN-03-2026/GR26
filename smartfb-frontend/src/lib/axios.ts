import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

/**
 * Axios instance with interceptors
 * - Auto attach access token to every request
 * - Auto attach tenant_id header
 * - Handle token refresh on 401
 * - Show toast notification on errors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const VERSION_BASE_URL = import.meta.env.VERSION_API_BASE_URL ||"V1"
 
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach token & tenant_id
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get tenant_id from localStorage (for multi-tenant)
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh token API
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other error codes with toast
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;

      switch (status) {
        case 400:
          // Bad request - không show toast, để component tự handle validation errors
          break;
        case 403:
          toast.error('Bạn không có quyền thực hiện thao tác này');
          break;
        case 404:
          toast.error('Không tìm thấy dữ liệu yêu cầu');
          break;
        case 409:
          toast.error(message || 'Dữ liệu đã tồn tại hoặc xung đột');
          break;
        case 500:
          toast.error('Lỗi hệ thống. Vui lòng thử lại sau.');
          break;
        case 503:
          toast.error('Dịch vụ tạm thời không khả dụng');
          break;
        default:
          if (status >= 500) {
            toast.error('Lỗi server. Vui lòng thử lại sau.');
          }
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      toast.error('Không thể kết nối đến server. Kiểm tra kết nối mạng.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
