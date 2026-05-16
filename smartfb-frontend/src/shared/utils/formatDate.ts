import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format date to Vietnamese format
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: vi });
}

/**
 * Format datetime to Vietnamese format
 * @param date - Date string or Date object
 * @returns Formatted datetime string like "15/03/2024 14:30"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}
