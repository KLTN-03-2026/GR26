import type { LocalTime } from '@modules/shift/types/shift.types';

/**
 * Số phút nhân viên được phép check-in sớm trước giờ bắt đầu ca.
 */
export const CHECK_IN_OPEN_BEFORE_MINUTES = 30;

/**
 * Trả về ngày hiện tại theo timezone trình duyệt ở định dạng backend đang dùng cho lịch ca.
 */
export const getTodayShiftDate = (baseDate = new Date()): string => {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Kiểm tra lịch ca đã quá ngày hay chưa.
 * Chuỗi `yyyy-MM-dd` có thể so sánh trực tiếp vì backend và frontend dùng cùng định dạng ISO date.
 */
export const isPastShiftDate = (dateValue?: string, todayValue = getTodayShiftDate()): boolean => {
  if (!dateValue) {
    return false;
  }

  return dateValue < todayValue;
};

/**
 * Ghép ngày làm việc và giờ bắt đầu ca thành Date theo timezone trình duyệt.
 */
export const getShiftStartDateTime = (
  shiftDate: string,
  startTime?: LocalTime | null
): Date | null => {
  const [year, month, day] = shiftDate.split('-').map(Number);

  if (!year || !month || !day || !startTime) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day,
    startTime.hour,
    startTime.minute,
    startTime.second,
    0
  );
};

/**
 * Tính thời điểm mở nút check-in, mặc định là 30 phút trước giờ bắt đầu ca.
 */
export const getShiftCheckInOpenAt = (
  shiftDate: string,
  startTime?: LocalTime | null,
  openBeforeMinutes = CHECK_IN_OPEN_BEFORE_MINUTES
): Date | null => {
  const shiftStartAt = getShiftStartDateTime(shiftDate, startTime);

  if (!shiftStartAt) {
    return null;
  }

  return new Date(shiftStartAt.getTime() - openBeforeMinutes * 60_000);
};

/**
 * Kiểm tra nút check-in đã được mở hay chưa.
 * Sau khi đã tới mốc mở, FE tiếp tục cho check-in để backend xử lý các rule đi muộn nếu có.
 */
export const isShiftCheckInOpen = (
  shiftDate: string,
  startTime?: LocalTime | null,
  now = new Date()
): boolean => {
  const checkInOpenAt = getShiftCheckInOpenAt(shiftDate, startTime);

  if (!checkInOpenAt) {
    return false;
  }

  return now.getTime() >= checkInOpenAt.getTime();
};
