import { ROUTES } from '@shared/constants/routes';

export const ACTIVE_SUBSCRIPTION_STATUS = 'ACTIVE';

export const OWNER_SUBSCRIPTION_WHITELIST = new Set<string>([
  ROUTES.OWNER.PACKAGES,
]);

export const normalizeSubscriptionStatus = (status?: string | null): string => {
  return status?.trim().toUpperCase() || 'UNKNOWN';
};

export const getBlockedMessage = (status: string): string => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Gói dịch vụ đang chờ thanh toán. Vui lòng hoàn tất thanh toán để mở khóa các tính năng vận hành.';
    case 'EXPIRED':
      return 'Gói dịch vụ đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng hệ thống.';
    case 'SUSPENDED':
      return 'Tài khoản đang bị tạm khóa. Vui lòng liên hệ quản trị hệ thống để được hỗ trợ.';
    case 'CANCELLED':
      return 'Gói dịch vụ đã bị hủy. Vui lòng chọn gói mới để tiếp tục sử dụng.';
    default:
      return 'Trạng thái gói dịch vụ hiện không cho phép sử dụng các tính năng nghiệp vụ.';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Chờ thanh toán';
    case 'EXPIRED':
      return 'Đã hết hạn';
    case 'SUSPENDED':
      return 'Tạm khóa';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
};
