import { type FC } from 'react';
import {
  LayoutDashboard,
  Table,
  ClipboardList,
  Newspaper,
  ChefHat,
  Archive,
  BookOpenCheck,
  Users2,
  Clock,
  Store,
  Ticket,
  Truck,
  Settings,
  Package,
} from 'lucide-react';
import { ROUTES } from '@shared/constants/routes';
import { ROLES } from '@shared/constants/roles';

export interface MenuItem {
  title: string;
  icon?: FC<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuConfig: MenuSection[] = [
  {
    title: 'Tổng Quan',
    items: [
      {
        title: 'Tổng Quan',
        roles: [ROLES.OWNER],
        children: [
          { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.OWNER.DASHBOARD, roles: [ROLES.OWNER] }
        ],
      },
    ],
  },
  {
    title: 'Vận Hành',
    items: [
      {
        title: 'Vận Hành',
        roles: [ROLES.OWNER, ROLES.STAFF],
        children: [
          { title: 'Bàn', icon: Table, path: ROUTES.OWNER.TABLES, roles: [ROLES.OWNER, ROLES.STAFF] },
          { title: 'Đơn hàng', icon: ClipboardList, path: ROUTES.OWNER.ORDERS, roles: [ROLES.OWNER] },
          { title: 'Đơn hàng', icon: ClipboardList, path: ROUTES.STAFF.ORDERS, roles: [ROLES.STAFF] },
          { title: 'Báo cáo doanh thu', icon: Newspaper, path: ROUTES.OWNER.REVENUE, roles: [ROLES.OWNER] },
        ],
      },
    ],
  },
  {
    title: 'Thực đơn & Kho',
    items: [
      {
        title: 'Thực đơn & Kho',
        icon: ChefHat,
        roles: [ROLES.OWNER, ROLES.STAFF],
        children: [
          { title: 'Thực đơn', icon: ChefHat, path: ROUTES.OWNER.MENU, roles: [ROLES.OWNER, ROLES.STAFF] },
          { title: 'Kho', icon: Archive, path: ROUTES.OWNER.INVENTORY, roles: [ROLES.OWNER] },
          { title: 'Kho', icon: Archive, path: ROUTES.STAFF.INVENTORY, roles: [ROLES.STAFF] },
          { title: 'Công thức', icon: BookOpenCheck, path: ROUTES.OWNER.RECIPES, roles: [ROLES.OWNER] },
        ],
      },
    ],
  },
  {
    title: 'Nhân sự',
    items: [
      {
        title: 'Nhân sự',
        roles: [ROLES.OWNER, ROLES.STAFF],
        children: [
          { title: 'Nhân viên', icon: Users2, path: ROUTES.OWNER.STAFF, roles: [ROLES.OWNER] },
          { title: 'Lịch làm', icon: Clock, path: ROUTES.OWNER.SCHEDULES, roles: [ROLES.OWNER, ROLES.STAFF] },
        ],
      },
    ],
  },
  {
    title: 'Kinh doanh',
    items: [
      {
        title: 'Kinh doanh',
        roles: [ROLES.OWNER],
        children: [
          { title: 'Chi nhánh', icon: Store, path: ROUTES.OWNER.BRANCHES, roles: [ROLES.OWNER] },
          { title: 'Khuyến mãi', icon: Ticket, path: ROUTES.OWNER.PROMOTIONS, roles: [ROLES.OWNER] },
          { title: 'Nhà cung cấp', icon: Truck, path: ROUTES.OWNER.SUPPLIERS, roles: [ROLES.OWNER] },
          { title: 'Báo cáo', icon: Newspaper, path: ROUTES.OWNER.REPORTS, roles: [ROLES.OWNER] },
        ],
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        title: 'Hệ thống',
        roles: [ROLES.OWNER],
        children: [
          { title: 'Cài đặt', icon: Settings, path: ROUTES.OWNER.SETTINGS, roles: [ROLES.OWNER] },
          { title: 'Gói dịch vụ', icon: Package, path: ROUTES.OWNER.PACKAGES, roles: [ROLES.OWNER] },
        ],
      },
    ],
  },
];
