import { ROUTES } from '@shared/constants/routes';
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

/**
 * Cấu hình điều hướng khu vực admin SaaS.
 * Admin quản trị tenant, gói dịch vụ và billing, tách khỏi nghiệp vụ vận hành quán.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        path: ROUTES.ADMIN_DASHBOARD,
        icon: LayoutDashboard,
        description: 'Số liệu vận hành SaaS',
      },
    ],
  },
  {
    title: 'Quản trị SaaS',
    items: [
      {
        title: 'Tenant',
        path: ROUTES.ADMIN_TENANTS,
        icon: Building2,
        description: 'Khách hàng và trạng thái thuê bao',
      },
      {
        title: 'Gói dịch vụ',
        path: ROUTES.ADMIN_PLANS,
        icon: BarChart3,
        description: 'Plan, giới hạn và tính năng',
      },
      {
        title: 'Billing',
        path: ROUTES.ADMIN_BILLING,
        icon: CreditCard,
        description: 'Hóa đơn subscription',
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        title: 'Cài đặt',
        path: ROUTES.ADMIN_SETTINGS,
        icon: Settings,
        description: 'Thiết lập admin SaaS',
      },
    ],
  },
];
