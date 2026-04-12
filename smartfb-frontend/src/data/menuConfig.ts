import { type FC } from 'react';
import {
  LayoutDashboard,
  Table,
  ClipboardList,
  Newspaper,
  CreditCard,
  ChefHat,
  Archive,
  BookOpenCheck,
  Users2,
  BriefcaseBusiness,
  Clock,
  Store,
  Ticket,
  Truck,
  Settings,
  Package,
} from 'lucide-react';
import { STAFF_ROUTE_PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { ROLES, type Role } from '@shared/constants/roles';

export interface MenuItem {
  title: string;
  icon?: FC<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  roles?: Role[];
  requiredPermissions?: readonly string[];
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
        roles: [ROLES.OWNER, ROLES.STAFF],
        children: [
          { title: 'Dashboard', icon: LayoutDashboard, path: ROUTES.OWNER.DASHBOARD, roles: [ROLES.OWNER] },
          {
            title: 'Dashboard',
            icon: LayoutDashboard,
            path: ROUTES.STAFF.DASHBOARD,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.DASHBOARD,
          },
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
          { title: 'Bàn', icon: Table, path: ROUTES.OWNER.TABLES, roles: [ROLES.OWNER] },
          {
            title: 'Bàn',
            icon: Table,
            path: ROUTES.STAFF.TABLES,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.TABLES,
          },
          { title: 'Đơn hàng', icon: ClipboardList, path: ROUTES.POS_MANAGEMENT, roles: [ROLES.OWNER] },
          {
            title: 'Đơn hàng',
            icon: ClipboardList,
            path: ROUTES.POS_MANAGEMENT,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
          },
          {
            title: 'Thanh toán',
            icon: CreditCard,
            path: ROUTES.POS_PAYMENT,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_PAYMENT,
          },
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
          { title: 'Thực đơn', icon: ChefHat, path: ROUTES.OWNER.MENU, roles: [ROLES.OWNER] },
          {
            title: 'Thực đơn',
            icon: ChefHat,
            path: ROUTES.STAFF.MENU,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.MENU,
          },
          { title: 'Kho', icon: Archive, path: ROUTES.OWNER.INVENTORY, roles: [ROLES.OWNER] },
          {
            title: 'Kho',
            icon: Archive,
            path: ROUTES.STAFF.INVENTORY,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.INVENTORY,
          },
          { title: 'Công thức', icon: BookOpenCheck, path: ROUTES.OWNER.RECIPES, roles: [ROLES.OWNER] },
          {
            title: 'Công thức',
            icon: BookOpenCheck,
            path: ROUTES.STAFF.RECIPES,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.RECIPES,
          },
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
          {
            title: 'Chức vụ',
            icon: BriefcaseBusiness,
            path: ROUTES.OWNER.STAFF_POSITIONS,
            roles: [ROLES.OWNER],
          },
          { title: 'Lịch làm', icon: Clock, path: ROUTES.OWNER.SCHEDULES, roles: [ROLES.OWNER] },
          {
            title: 'Lịch làm',
            icon: Clock,
            path: ROUTES.STAFF.MY_SHIFTS,
            roles: [ROLES.STAFF],
            requiredPermissions: STAFF_ROUTE_PERMISSIONS.MY_SHIFTS,
          },
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
