import { ROLES } from '../constants/roles';

/**
 * Common types used across the application
 */

export type Role = typeof ROLES[keyof typeof ROLES];

export const Status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  MOMO: 'momo',
  ZALOPAY: 'zalopay',
  VNPAY: 'vnpay',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export interface SelectOption {
  value: string;
  label: string;
}
