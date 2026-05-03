import type { ReactNode } from 'react';
import AdminBillingPage from '@pages/admin/AdminBillingPage';
import AdminDashboardPage from '@pages/admin/AdminDashboardPage';
import AdminPlansPage from '@pages/admin/AdminPlansPage';
import AdminTenantsPage from '@pages/admin/AdminTenantsPage';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import AiForecastPage from '@pages/owner/AiForecastPage';
import BranchDetailPage from '@pages/owner/BranchDetailPage';
import BranchesPage from '@pages/owner/BranchesPage';
import CreateBranchPage from '@pages/owner/CreateBranchPage';
import CreateStaffPage from '@pages/owner/CreateStaffPage';
import DashboardPage from '@pages/owner/DashboardPage';
import HrReportPage from '@pages/owner/HrReportPage';
import InventoryPage from '@pages/owner/InventoryPage';
import InventoryReportPage from '@pages/owner/InventoryReportPage';
import MenuPage from '@pages/owner/MenuPage';
import PackagesPage from '@pages/owner/PackagesPage';
import RecipesPage from '@pages/owner/RecipesPage';
import RevenuePage from '@pages/owner/RevenuePage';
import StaffDetailPage from '@pages/owner/StaffDetailPage';
import StaffPage from '@pages/owner/StaffPage';
import StaffPositionsPage from '@pages/owner/StaffPositionsPage';
import SupplierDetailPage from '@pages/owner/SupplierDetailPage';
import SuppliersPage from '@pages/owner/SuppliersPage';
import TablesPage from '@pages/owner/TablesPage';
import OrderDetailPage from '@pages/pos/OrderDetailPage';
import MyShiftsPage from '@pages/pos/MyShiftsPage';
import OrderPage from '@pages/pos/OrderPage';
import PaymentPage from '@pages/pos/PaymentPage';
import OrderManagementPage from '@pages/pos/OrderManagementPage';
import ExpensesPage from '@pages/shared/ExpensesPage';
import ShiftManagementPage from '@pages/owner/ShiftManagementPage';
import ShiftTemplateDetailPage from '@pages/owner/ShiftTemplateDetailPage';
import VouchersPage from '@pages/owner/VouchersPage';
import PosSessionHistoryPage from '@pages/owner/PosSessionHistoryPage';
import SettingsPage from '@pages/owner/SettingsPage';
import { PosSessionGate } from '@modules/pos-session/components/PosSessionGate';
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
  createRoute(
    ROUTES.ADMIN_DASHBOARD,
    'Tổng quan hệ thống',
    <AdminDashboardPage />
  ),
  createRoute(
    ROUTES.ADMIN_PLANS,
    'Quản lý gói dịch vụ',
    <AdminPlansPage />
  ),
  createRoute(
    ROUTES.ADMIN_TENANTS,
    'Quản lý tenant',
    <AdminTenantsPage />
  ),
  createRoute(
    ROUTES.ADMIN_BILLING,
    'Billing',
    <AdminBillingPage />
  ),
  createPlaceholderRoute(
    ROUTES.ADMIN_SETTINGS,
    'Cài đặt admin',
    'Cài đặt admin',
    'Thiết lập khu vực quản trị SaaS sẽ được triển khai sau khi hoàn thiện các luồng chính.'
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
  createRoute(ROUTES.OWNER.AI_FORECAST, 'Dự báo tồn kho AI', <AiForecastPage />),
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
  createRoute(ROUTES.OWNER.POS_SESSIONS, 'Lịch sử ca POS', <PosSessionHistoryPage />),
  createRoute(ROUTES.OWNER.SUPPLIERS, 'Nhà cung cấp', <SuppliersPage />),
  createRoute(ROUTES.OWNER.SUPPLIERS_DETAIL, 'Chi tiết nhà cung cấp', <SupplierDetailPage />),
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
  createRoute(ROUTES.OWNER.SETTINGS, 'Cài đặt', <SettingsPage />),
  createRoute(
    ROUTES.OWNER.PACKAGES,
    'Gói dịch vụ',
    <PackagesPage />
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
  createRoute(ROUTES.STAFF.AI_FORECAST, 'Dự báo tồn kho AI', <AiForecastPage />, {
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.AI_FORECAST,
  }),
  createRoute(
    ROUTES.STAFF.MY_SHIFTS,
    'Ca làm của tôi',
    <MyShiftsPage />,
    { requiredPermissions: STAFF_ROUTE_PERMISSIONS.MY_SHIFTS }
  ),
];

export const posRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.POS_ORDER,
    pageTitle: 'Đặt món',
    element: (
      <PosSessionGate>
        <OrderPage />
      </PosSessionGate>
    ),
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_ORDER,
  },
  {
    path: ROUTES.POS_PAYMENT,
    pageTitle: 'Thanh toán',
    element: (
      <PosSessionGate>
        <PaymentPage />
      </PosSessionGate>
    ),
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_PAYMENT,
  },
  {
    path: ROUTES.POS_MANAGEMENT,
    pageTitle: 'Quản lý đơn hàng',
    // Danh sách đơn hàng là màn tra cứu vận hành, không bắt buộc mở ca POS.
    element: <OrderManagementPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
  },
  {
    path: ROUTES.POS_ORDER_DETAIL,
    pageTitle: 'Chi tiết đơn hàng',
    // Chi tiết đơn chỉ yêu cầu quyền xem; khi cần xử lý đơn active sẽ chuyển sang màn order có gate.
    element: <OrderDetailPage />,
    requiredPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
  },
];
