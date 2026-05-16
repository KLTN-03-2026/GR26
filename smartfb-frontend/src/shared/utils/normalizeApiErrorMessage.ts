const DUPLICATE_KEY_MARKERS = [
  'duplicate key value',
  'unique constraint',
  'already exists',
];

/**
 * Chuẩn hóa message lỗi kỹ thuật từ backend thành thông báo nghiệp vụ cho user.
 *
 * @param message - Message gốc từ backend hoặc AxiosError
 * @returns Message đã chuẩn hóa, hoặc `undefined` nếu không có message đầu vào
 */
export const normalizeApiErrorMessage = (message?: string): string | undefined => {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) {
    return undefined;
  }

  const normalizedMessage = trimmedMessage.toLowerCase();
  const isDuplicatePhoneMessage =
    normalizedMessage.includes('duplicate_phone') ||
    (
      normalizedMessage.includes('số điện thoại') &&
      (
        normalizedMessage.includes('đã được đăng ký') ||
        normalizedMessage.includes('đã tồn tại')
      )
    );

  if (isDuplicatePhoneMessage) {
    return 'Số điện thoại này đã tồn tại trong cửa hàng hiện tại. Vui lòng dùng số khác.';
  }

  const isDuplicateKeyError = DUPLICATE_KEY_MARKERS.some((marker) =>
    normalizedMessage.includes(marker)
  );

  if (!isDuplicateKeyError) {
    return trimmedMessage;
  }

  if (
    normalizedMessage.includes('uq_users_email_tenant') ||
    normalizedMessage.includes('(tenant_id, email)') ||
    normalizedMessage.includes('email)=')
  ) {
    return 'Email này đã tồn tại trong cửa hàng hiện tại. Vui lòng dùng email khác.';
  }

  if (
    normalizedMessage.includes('uq_users_phone_tenant') ||
    normalizedMessage.includes('(tenant_id, phone)') ||
    normalizedMessage.includes('phone)=')
  ) {
    return 'Số điện thoại này đã tồn tại trong cửa hàng hiện tại. Vui lòng dùng số khác.';
  }

  if (
    normalizedMessage.includes('employee_code') ||
    normalizedMessage.includes('employee code')
  ) {
    return 'Mã nhân viên này đã tồn tại. Vui lòng tạo lại mã hoặc kiểm tra danh sách nhân viên.';
  }

  return 'Dữ liệu đã tồn tại trong hệ thống. Vui lòng kiểm tra lại thông tin.';
};
