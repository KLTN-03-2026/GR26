import { format } from 'date-fns';

interface DateRangeValueLike {
  from?: string;
  to?: string;
}

/**
 * Lấy ngày hiện tại theo format `YYYY-MM-DD` để dùng cho input date và query params.
 */
export const getTodayDateValue = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Tạo khoảng ngày mặc định là đúng ngày hiện tại.
 * Dùng cho các màn cần gọi API theo ngày ngay khi mở lần đầu.
 */
export const buildTodayDateRangeValue = (): Required<Pick<DateRangeValueLike, 'from' | 'to'>> => {
  const today = getTodayDateValue();

  return {
    from: today,
    to: today,
  };
};

/**
 * So sánh hai khoảng ngày theo giá trị chuỗi để xác định filter có đang lệch khỏi mặc định hay không.
 */
export const isSameDateRangeValue = (
  left?: DateRangeValueLike,
  right?: DateRangeValueLike,
): boolean => {
  return (left?.from ?? '') === (right?.from ?? '') && (left?.to ?? '') === (right?.to ?? '');
};
