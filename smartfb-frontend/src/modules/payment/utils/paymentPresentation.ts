/**
 * Nhãn nghiệp vụ cho các phương thức thanh toán backend có thể trả về.
 * Giữ thêm một số mã legacy để màn chi tiết vẫn đọc được dữ liệu cũ.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  VIETQR: 'VietQR',
  MOMO: 'MoMo',
  PAYOS: 'PayOS',
  ZALOPAY: 'ZaloPay',
  TRANSFER: 'Chuyển khoản',
  BANKING: 'Chuyển khoản',
  QR_CODE: 'QR',
  OTHER: 'Khác',
  UNKNOWN: 'Chưa xác định',
};

/**
 * Chuyển mã phương thức thanh toán từ backend sang nhãn tiếng Việt.
 *
 * @param method - Mã phương thức thanh toán từ payment hoặc invoice
 */
export const resolvePaymentMethodLabel = (method?: string | null): string => {
  if (!method) {
    return 'Chưa xác định';
  }

  const normalizedMethod = method.trim().toUpperCase();

  return PAYMENT_METHOD_LABELS[normalizedMethod] ?? method;
};
