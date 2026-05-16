import { normalizeApiErrorMessage } from '@shared/utils/normalizeApiErrorMessage';

export type StaffMutationErrorField = 'email' | 'phone' | 'employeeCode';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getStringProperty = (
  value: Record<string, unknown>,
  property: string
): string | undefined => {
  const propertyValue = value[property];
  return typeof propertyValue === 'string' ? propertyValue : undefined;
};

const getStaffApiResponseData = (error: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }

  return isRecord(error.response.data) ? error.response.data : undefined;
};

const getStaffApiResponseMessage = (error: unknown): string | undefined => {
  const responseData = getStaffApiResponseData(error);

  if (!responseData) {
    return undefined;
  }

  if (isRecord(responseData.error)) {
    const nestedMessage = getStringProperty(responseData.error, 'message');
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return getStringProperty(responseData, 'message');
};

const getStaffApiResponseCode = (error: unknown): string | undefined => {
  const responseData = getStaffApiResponseData(error);

  if (!responseData) {
    return undefined;
  }

  if (isRecord(responseData.error)) {
    const nestedCode = getStringProperty(responseData.error, 'code');
    if (nestedCode) {
      return nestedCode;
    }
  }

  return getStringProperty(responseData, 'code');
};

const getStaffErrorRawMessages = (error: unknown): string[] => {
  const messages = [getStaffApiResponseCode(error), getStaffApiResponseMessage(error)];

  if (error instanceof Error) {
    messages.push(error.message);
  }

  return messages.filter((message): message is string => Boolean(message?.trim()));
};

/**
 * Chuẩn hóa message lỗi mutation trong module Nhân sự.
 * Ưu tiên message nghiệp vụ từ backend nếu response có đúng contract `ApiResponse`.
 */
export const getStaffMutationErrorMessage = (error: unknown): string => {
  const apiResponseMessage = normalizeApiErrorMessage(getStaffApiResponseMessage(error));

  if (apiResponseMessage) {
    return apiResponseMessage;
  }

  if (error instanceof Error) {
    return normalizeApiErrorMessage(error.message) ?? 'Vui lòng thử lại sau';
  }

  return 'Vui lòng thử lại sau';
};

/**
 * Xác định field form nên hiển thị lỗi dựa trên constraint hoặc message backend.
 *
 * @param error - Lỗi mutation từ Axios/TanStack Query
 * @returns Field tương ứng trong form tạo nhân viên nếu nhận diện được
 */
export const getStaffMutationErrorField = (
  error: unknown
): StaffMutationErrorField | undefined => {
  const normalizedMessages = getStaffErrorRawMessages(error).map((message) =>
    message.toLowerCase()
  );

  if (
    normalizedMessages.some((message) =>
      message.includes('uq_users_email_tenant') ||
      message.includes('(tenant_id, email)') ||
      message.includes('email)=') ||
      message.includes('email này đã tồn tại')
    )
  ) {
    return 'email';
  }

  if (
    normalizedMessages.some((message) =>
      message.includes('duplicate_phone') ||
      message.includes('uq_users_phone_tenant') ||
      message.includes('(tenant_id, phone)') ||
      message.includes('phone)=') ||
      message.includes('số điện thoại này đã tồn tại') ||
      (message.includes('số điện thoại') && message.includes('đã được đăng ký'))
    )
  ) {
    return 'phone';
  }

  if (
    normalizedMessages.some((message) =>
      message.includes('employee_code') ||
      message.includes('employee code') ||
      message.includes('mã nhân viên này đã tồn tại')
    )
  ) {
    return 'employeeCode';
  }

  return undefined;
};
