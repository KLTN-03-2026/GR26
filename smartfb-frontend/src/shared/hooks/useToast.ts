import toast from 'react-hot-toast';

/**
 * Custom toast hook với styled notifications
 * Wrapper cho react-hot-toast với brand colors và messages tiếng Việt
 * 
 * @example
 * ```typescript
 * const { success, error } = useToast();
 * success('Thành công'); // simple message
 * success('Lưu thành công', 'Dữ liệu đã được cập nhật'); // with description
 * error('Lỗi', 'Không thể kết nối server');
 * ```
 */
export const useToast = () => {
  /**
   * Hiển thị success toast
   * @param message - Tin nhắn chính
   * @param description - Mô tả chi tiết (optional)
   */
  const success = (message: string, description?: string): string => {
    const content = description ? `${message}\n${description}` : message;
    return toast.success(content, {
      duration: 3000,
    });
  };

  /**
   * Hiển thị error toast
   * @param message - Tin nhắn chính
   * @param description - Mô tả chi tiết (optional)
   */
  const error = (message: string, description?: string): string => {
    const content = description ? `${message}\n${description}` : message;
    return toast.error(content, {
      duration: 4000,
    });
  };

  /**
   * Hiển thị loading toast
   * @param message - Tin nhắn loading
   * @returns toastId để dismiss sau
   */
  const loading = (message: string): string => {
    return toast.loading(message);
  };

  /**
   * Toast promise - auto show loading → success/error
   * @param promiseToResolve - Promise cần track
   * @param messages - Messages cho mỗi state
   */
  const promise = <T,>(
    promiseToResolve: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ): Promise<T> => {
    return toast.promise(promiseToResolve, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  };

  /**
   * Dismiss toast
   * @param toastId - ID của toast cần dismiss (optional - dismiss all nếu không truyền)
   */
  const dismiss = (toastId?: string): void => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    loading,
    promise,
    dismiss,
  } as const;
};
