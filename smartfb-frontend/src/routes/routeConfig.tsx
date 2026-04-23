import type { ReactNode } from 'react';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import BranchDetailPage from '@pages/owner/BranchDetailPage';
import BranchesPage from '@pages/owner/BranchesPage';
import CreateBranchPage from '@pages/owner/CreateBranchPage';
import CreateStaffPage from '@pages/owner/CreateStaffPage';
import DashboardPage from '@pages/owner/DashboardPage';
import HrReportPage from '@pages/owner/HrReportPage';
import InventoryPage from '@pages/owner/InventoryPage';
import InventoryReportPage from '@pages/owner/InventoryReportPage';
import MenuPage from '@pages/owner/MenuPage';
import RecipesPage from '@pages/owner/RecipesPage';
import RevenuePage from '@pages/owner/RevenuePage';
import StaffDetailPage from '@pages/owner/StaffDetailPage';
import StaffPage from '@pages/owner/StaffPage';
import StaffPositionsPage from '@pages/owner/StaffPositionsPage';
import TablesPage from '@pages/owner/TablesPage';
import OrderDetailPage from '@pages/pos/OrderDetailPage';
import OrderPage from '@pages/pos/OrderPage';
import PaymentPage from '@pages/pos/PaymentPage';
import OrderManagementPage from '@pages/pos/OrderManagementPage';
import ExpensesPage from '@pages/shared/ExpensesPage';
import ShiftManagementPage from '@pages/owner/ShiftManagementPage';
import ShiftTemplateDetailPage from '@pages/owner/ShiftTemplateDetailPage';
import VouchersPage from '@pages/owner/VouchersPage';
import { PagePlaceholder } from '@shared/components/common/PagePlaceholder';
import { STAFF_ROUTE_PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import type { AccessRequirement } from '@shared/utils/accessControl';
import { Navigate } from 'react-router-dom';

export interface RouteConfigItem extends AccessRequirement {
  path: string;
  pageTitle: string;
  element: ReactNode;
}

/**
 * Tạo cấu hình route cơ bản để tránh lặp object shape ở toàn file.
 */
const createRoute = (
  path: string,
  pageTitle: string,
  element: ReactNode,
  accessRequirement?: AccessRequirement
): RouteConfigItem => ({
  path,
  pageTitle,
  element,
  ...accessRequirement,
});

/**
 * Tạo nhanh placeholder route cho các page chưa được triển khai riêng.
 */
const createPlaceholderRoute = (
  path: string,
  pageTitle: string,
  title: string,
  description: string,
  accessRequirement?: AccessRequirement
): RouteConfigItem => {
  return createRoute(
    path,
    pageTitle,
    <PagePlaceholder title={title} description={description} />,
    accessRequirement
  );
};

export const publicRoutes: RouteConfigItem[] = [
  createRoute(ROUTES.LOGIN, 'Đăng nhập', <LoginPage />),
  createRoute(ROUTES.FORGOT_PASSWORD, 'Quên mật khẩu', <ForgotPasswordPage />),
  createRoute(ROUTES.REGISTER, 'Đăng ký', <RegisterPage />),
];

export const adminRoutes: RouteConfigItem[] = [
  createPlaceholderRoute(
    ROUTES.ADMIN_DASHBOARD,
    'Tổng quan hệ thống',
    'Tổng quan hệ thống',
    'Trang tổng hợp số liệu SaaS cho quản trị viên đang được tách thành page riêng.'
  ),
  createPlaceholderRoute(
    ROUTES.ADMIN_PLANS,
    'Quản lý gói dịch vụ',
    'Quản lý gói dịch vụ',
    'Khu vực cấu hình plan và billing admin sẽ được triển khai tại page riêng trong module tiếp theo.'
  ),
  createPlaceholderRoute(
    ROUTES.ADMIN_TENANTS,
    'Quản lý tenant',
    'Quản lý tenant',
    'Danh sách tenant và công cụ quản trị SaaS đang được chuẩn hóa lại cấu trúc page.'
  ),
];

export const ownerRoutes: RouteConfigItem[] = [
  createRoute(
    ROUTES.OWNER.DASHBOARD,
    'Dashboard',
    <DashboardPage />
  ),
  createRoute(ROUTES.OWNER.TABLES, 'Quản lý bàn', <TablesPage />),
  createRoute(
    ROUTES.OWNER.ORDERS,
    'Quản lý đơn hàng',
    <Navigate to={ROUTES.POS_MANAGEMENT} replace />
  ),
  createRoute(
    ROUTES.OWNER.REVENUE,
    'Báo cáo doanh thu',
    <RevenuePage />
  ),
  createRoute(ROUTES.OWNER.EXPENSES, 'Thu chi', <ExpensesPage />),
  createRoute(ROUTES.OWNER.MENU, 'Quản lý thực đơn', <MenuPage />),
  createRoute(ROUTES.OWNER.INVENTORY, 'Quản lý kho', <InventoryPage />),
  createRoute(ROUTES.OWNER.RECIPES, 'Công thức', <RecipesPage />),
  createRoute(ROUTES.OWNER.STAFF, 'Quản lý nhân viên', <StaffPage />),
  createRoute(ROUTES.OWNER.STAFF_NEW, 'Thêm nhân viên mới', <CreateStaffPage />),
  createRoute(ROUTES.OWNER.STAFF_DETAIL, 'Chi tiết nhân viên', <StaffDetailPage />),
  createRoute(ROUTES.OWNER.STAFF_POSITIONS, 'Quản lý chức vụ', <StaffPositionsPage />),
  createRoute(
    ROUTES.OWNER.SCHEDULES,
    'Lịch làm việc',
    <ShiftManagementPage />
  ),
  createRoute(
    ROUTES.OWNER.SHIFT_TEMPLATE_NEW,
    'Thêm ca mẫu',
    <ShiftManagementPage />
  ),
  createRoute(
    ROUTES.OWNER.SHIFT_TEMPLATE_DETAIL,
    'Chi tiết ca mẫu',
    <ShiftTemplateDetailPage />
  ),
  createRoute(ROUTES.OWNER.BRANCHES, 'Quản lý chi nhánh', <BranchesPage />),
  createRoute(ROUTES.OWNER.BRANCHES_NEW, 'Tạo chi nhánh mới', <CreateBranchPage />),
  createRoute(ROUTES.OWNER.BRANCHES_DETAIL, 'Chi tiết chi nhánh', <BranchDetailPage />),
  createRoute(ROUTES.OWNER.PROMOTIONS, 'Quản lý voucher', <VouchersPage />),
  createPlaceholderRoute(
    ROUTES.OWNER.SUPPLIERS,
    'Nhà cung cấp',
    'Nhà cung cấp',
    'Page nhà cung cấp sẽ được thêm riêng ở bước triển khai module supplier.'
  ),
  createRoute(
    ROUTES.OWNER.REPORTS,
    'Báo cáo',
    <Navigate to={ROUTES.OWNER.REPORT_REVENUE} replace />
  ),
  createRoute(
    ROUTES.OWNER.REPORT_REVENUE,
    'Báo cáo doanh thu',
    <RevenuePage />
  ),
  createRoute(
    ROUTES.OWNER.REPORT_INVENTORY,
    'Báo cáo kho',
    <InventoryReportPage />
  ),
  createRoute(
    ROUTES.OWNER.REPORT_HR,
    'Báo cáo nhân sự',
    <HrReportPage />
  ),
  createPlaceholderRoute(
    ROUTES.OWNER.SETTINGS,
    'Cài đặt',
    'Cài đặt',
    'Trang cài đặt owner sẽ được triển khai ở file page riêng.'
  ),
  createPlaceholderRoute(
    ROUTES.OWNER.PACKAGES,
    'Gói dịch vụ',
    'Gói dịch vụ',
    'Trang gói dịch vụ đang dùng placeholder để hoàn thiện route map trước.'
  ),
];

export const staffRoutes: RouteConfigItem[] = [
  createPlaceholderRoute(
    ROUTES.STAFF.DASHBOARD,
    'Dashboard Nhân viên',
    'Dashboard Nhân viên',
    'Trang dashboard staff đang được tách riêng, route đã sẵn sàng theo đúng cấu trúc.',
    { requiredPermissions: STAFF_ROUTE_PERMISSIONS.DASHBOARD }
  ),
  createRoute(
    ROUTES.STAFF.TABLES,
    'Bàn',
    <TablesPage />,
    { requiredPermissions: STAFF_ROUTE_PERMISSIONS.TABLES }
  ),
  createRoute(
    ROUTES.STAFF.ORDERS,
    'Order',
    <Navigate to={ROUTES.POS_MANAGEMENT} replace />,
    { requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT }
  ),
  createRoute(ROUTES.STAFF.STAFF, 'Nhân viên', <StaffPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.STAFF,
  }),
  createRoute(ROUTES.STAFF.STAFF_POSITIONS, 'Chức vụ', <StaffPositionsPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.STAFF_POSITIONS,
  }),
  createRoute(ROUTES.STAFF.EXPENSES, 'Thu chi', <ExpensesPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.EXPENSES,
  }),
  createRoute(ROUTES.STAFF.MENU, 'Thực đơn', <MenuPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.MENU,
  }),
  createRoute(ROUTES.STAFF.RECIPES, 'Công thức', <RecipesPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.RECIPES,
  }),
  createRoute(ROUTES.STAFF.INVENTORY, 'Quản lý kho', <InventoryPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.INVENTORY,
  }),
  createPlaceholderRoute(
    ROUTES.STAFF.MY_SHIFTS,
    'Ca làm của tôi',
    'Ca làm của tôi',
    'Trang ca làm của nhân viên sẽ được thêm riêng ở bước triển khai module schedule.',
    { requiredPermissions: STAFF_ROUTE_PERMISSIONS.MY_SHIFTS }
  ),
];

export const posRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.POS_ORDER,
    pageTitle: 'Đặt món',
    element: <OrderPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_ORDER,
  },
  {
    path: ROUTES.POS_PAYMENT,
    pageTitle: 'Thanh toán',
    element: <PaymentPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_PAYMENT,
  },
  {
    path: ROUTES.POS_MANAGEMENT,
    pageTitle: 'Quản lý đơn hàng',
    element: <OrderManagementPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
  },
  {
    path: ROUTES.POS_ORDER_DETAIL,
    pageTitle: 'Chi tiết đơn hàng',
    element: <OrderDetailPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
  },
];
