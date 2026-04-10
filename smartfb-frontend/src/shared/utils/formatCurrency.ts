/**
 * Format number to Vietnamese currency format
 * @param amount - Amount in VND
 * @returns Formatted string like "10.000 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted string like "1.000.000"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Parse formatted currency string back to number
 * @param formattedStr - String like "10.000 ₫" or "10000"
 * @returns Number
 */
export function parseVND(formattedStr: string): number {
  return Number(formattedStr.replace(/[^\d]/g, ''));
}
