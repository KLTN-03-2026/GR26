import type { ReactNode } from 'react';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import BranchDetailPage from '@pages/owner/BranchDetailPage';
import BranchesPage from '@pages/owner/BranchesPage';
import CreateBranchPage from '@pages/owner/CreateBranchPage';
import CreateStaffPage from '@pages/owner/CreateStaffPage';
import InventoryPage from '@pages/owner/InventoryPage';
import MenuPage from '@pages/owner/MenuPage';
import RecipesPage from '@pages/owner/RecipesPage';
import StaffDetailPage from '@pages/owner/StaffDetailPage';
import StaffPage from '@pages/owner/StaffPage';
import TablesPage from '@pages/owner/TablesPage';
import OrderPage from '@pages/pos/OrderPage';
import PaymentPage from '@pages/pos/PaymentPage';
import OrderManagementPage from '@pages/pos/OrderManagementPage';
import { PagePlaceholder } from '@shared/components/common/PagePlaceholder';
import { ROUTES } from '@shared/constants/routes';
import { Navigate } from 'react-router-dom';

export interface RouteConfigItem {
  path: string;
  pageTitle: string;
  element: ReactNode;
}

/**
 * Tạo cấu hình route cơ bản để tránh lặp object shape ở toàn file.
 */
const createRoute = (path: string, pageTitle: string, element: ReactNode): RouteConfigItem => ({
  path,
  pageTitle,
  element,
});

/**
 * Tạo nhanh placeholder route cho các page chưa được triển khai riêng.
 */
const createPlaceholderRoute = (
  path: string,
  pageTitle: string,
  title: string,
  description: string
): RouteConfigItem => {
  return createRoute(
    path,
    pageTitle,
    <PagePlaceholder title={title} description={description} />
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
  createPlaceholderRoute(
    ROUTES.OWNER.DASHBOARD,
    'Dashboard',
    'Dashboard Chủ quán',
    'Trang dashboard owner đang được tách riêng khỏi file routes.'
  ),
  createRoute(ROUTES.OWNER.TABLES, 'Quản lý bàn', <TablesPage />),
  createRoute(
    ROUTES.OWNER.ORDERS,
    'Quản lý đơn hàng',
    <Navigate to={ROUTES.POS_MANAGEMENT} replace />
  ),
  createPlaceholderRoute(
    ROUTES.OWNER.REVENUE,
    'Báo cáo doanh thu',
    'Báo cáo doanh thu',
    'Trang báo cáo doanh thu đang dùng placeholder để route đi đúng vị trí ngay từ bây giờ.'
  ),
  createRoute(ROUTES.OWNER.MENU, 'Quản lý thực đơn', <MenuPage />),
  createRoute(ROUTES.OWNER.INVENTORY, 'Quản lý kho', <InventoryPage />),
  createRoute(ROUTES.OWNER.RECIPES, 'Công thức', <RecipesPage />),
  createRoute(ROUTES.OWNER.STAFF, 'Quản lý nhân viên', <StaffPage />),
  createRoute(ROUTES.OWNER.STAFF_NEW, 'Thêm nhân viên mới', <CreateStaffPage />),
  createRoute(ROUTES.OWNER.STAFF_DETAIL, 'Chi tiết nhân viên', <StaffDetailPage />),
  createPlaceholderRoute(
    ROUTES.OWNER.SCHEDULES,
    'Lịch làm việc',
    'Lịch làm việc',
    'Page lịch làm việc đang được dựng lại để bám đúng structure role-based pages.'
  ),
  createRoute(ROUTES.OWNER.BRANCHES, 'Quản lý chi nhánh', <BranchesPage />),
  createRoute(ROUTES.OWNER.BRANCHES_NEW, 'Tạo chi nhánh mới', <CreateBranchPage />),
  createRoute(ROUTES.OWNER.BRANCHES_DETAIL, 'Chi tiết chi nhánh', <BranchDetailPage />),
  createPlaceholderRoute(
    ROUTES.OWNER.PROMOTIONS,
    'Khuyến mãi',
    'Khuyến mãi',
    'Trang khuyến mãi đang dùng placeholder để hoàn chỉnh hệ route trước.'
  ),
  createPlaceholderRoute(
    ROUTES.OWNER.SUPPLIERS,
    'Nhà cung cấp',
    'Nhà cung cấp',
    'Page nhà cung cấp sẽ được thêm riêng ở bước triển khai module supplier.'
  ),
  createPlaceholderRoute(
    ROUTES.OWNER.REPORTS,
    'Báo cáo',
    'Báo cáo',
    'Khu vực báo cáo tổng hợp đang chờ page riêng nhưng route đã được set up đúng vị trí.'
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
    'Trang dashboard staff đang được tách riêng, route đã sẵn sàng theo đúng cấu trúc.'
  ),
  createPlaceholderRoute(
    ROUTES.STAFF.TABLES,
    'Bàn',
    'Bàn',
    'Trang thao tác bàn cho nhân viên đang được chuẩn hóa về page riêng.'
  ),
  createRoute(
    ROUTES.STAFF.ORDERS,
    'Quản lý đơn hàng',
    <Navigate to={ROUTES.POS_MANAGEMENT} replace />
  ),
  createRoute(ROUTES.STAFF.INVENTORY, 'Quản lý kho', <InventoryPage />),
  createPlaceholderRoute(
    ROUTES.STAFF.MY_SHIFTS,
    'Ca làm của tôi',
    'Ca làm của tôi',
    'Trang ca làm của nhân viên sẽ được thêm riêng ở bước triển khai module schedule.'
  ),
];

export const posRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.POS_ORDER,
    pageTitle: 'Đặt món',
    element: <OrderPage />,
  },
  {
    path: ROUTES.POS_PAYMENT,
    pageTitle: 'Thanh toán',
    element: <PaymentPage />,
  },
  {
    path: ROUTES.POS_MANAGEMENT,
    pageTitle: 'Quản lý đơn hàng',
    element: <OrderManagementPage />,
  },
];
