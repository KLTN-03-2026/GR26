import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import BranchDetailPage from '@pages/owner/BranchDetailPage';
import BranchesPage from '@pages/owner/BranchesPage';
import CreateBranchPage from '@pages/owner/CreateBranchPage';
import MenuPage from '@pages/owner/MenuPage';
import StaffPage from '@pages/owner/StaffPage';
import StaffDetailPage from '@pages/owner/StaffDetailPage';
import CreateStaffPage from '@pages/owner/CreateStaffPage';
import PositionsPage from '@pages/owner/PositionsPage';
import PermissionsPage from '@pages/owner/PermissionsPage';
import ShiftManagementPage from '@pages/owner/ShiftManagementPage';
import OrderPage from '@pages/pos/OrderPage';
import PaymentPage from '@pages/pos/PaymentPage';
import ShiftRegistrationPage from '@pages/staff/ShiftRegistrationPage';
import SuppliersPage from '@pages/owner/SuppliersPage';
import SupplierDetailPage from '@pages/owner/SupplierDetailPage';
import StaffSupplierListPage from '@pages/staff/SupplierListPage';
import OrderManagementPage from '@pages/pos/OrderManagementPage';
import { PagePlaceholder } from '@shared/components/common/PagePlaceholder';
import { ROUTES } from '@shared/constants/routes';

export interface RouteConfigItem {
  path: string;
  pageTitle: string;
  element: React.ReactNode;
}

export const publicRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.LOGIN,
    pageTitle: 'Đăng nhập',
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    pageTitle: 'Đăng ký',
    element: <RegisterPage />,
  },
];

export const adminRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.ADMIN_DASHBOARD,
    pageTitle: 'Tổng quan hệ thống',
    element: (
      <PagePlaceholder
        title="Tổng quan hệ thống"
        description="Trang tổng hợp số liệu SaaS cho quản trị viên đang được tách thành page riêng."
      />
    ),
  },
  {
    path: ROUTES.ADMIN_PLANS,
    pageTitle: 'Quản lý gói dịch vụ',
    element: (
      <PagePlaceholder
        title="Quản lý gói dịch vụ"
        description="Khu vực cấu hình plan và billing admin sẽ được triển khai tại page riêng trong module tiếp theo."
      />
    ),
  },
  {
    path: ROUTES.ADMIN_TENANTS,
    pageTitle: 'Quản lý tenant',
    element: (
      <PagePlaceholder
        title="Quản lý tenant"
        description="Danh sách tenant và công cụ quản trị SaaS đang được chuẩn hóa lại cấu trúc page."
      />
    ),
  },
];

export const ownerRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.OWNER.DASHBOARD,
    pageTitle: 'Dashboard',
    element: (
      <PagePlaceholder
        title="Dashboard Chủ quán"
        description="Trang dashboard owner đang được tách riêng khỏi file routes."
      />
    ),
  },
  {
    path: ROUTES.OWNER.TABLES,
    pageTitle: 'Quản lý bàn',
    element: (
      <PagePlaceholder
        title="Quản lý bàn"
        description="Module sơ đồ bàn đang được đưa về page chuyên trách."
      />
    ),
  },
  {
    path: ROUTES.OWNER.ORDERS,
    pageTitle: 'Quản lý đơn hàng',
    element: (
      <PagePlaceholder
        title="Quản lý đơn hàng"
        description="Page quản lý đơn hàng sẽ được tách riêng theo đúng cấu trúc pages/owner."
      />
    ),
  },
  {
    path: ROUTES.OWNER.REVENUE,
    pageTitle: 'Báo cáo doanh thu',
    element: (
      <PagePlaceholder
        title="Báo cáo doanh thu"
        description="Trang báo cáo doanh thu đang dùng placeholder để route đi đúng vị trí ngay từ bây giờ."
      />
    ),
  },
  {
    path: ROUTES.OWNER.MENU,
    pageTitle: 'Quản lý thực đơn',
    element: <MenuPage />,
  },
  {
    path: ROUTES.OWNER.INVENTORY,
    pageTitle: 'Quản lý kho',
    element: (
      <PagePlaceholder
        title="Quản lý kho"
        description="Page kho sẽ được tách riêng thành file page theo chuẩn module."
      />
    ),
  },
  {
    path: ROUTES.OWNER.RECIPES,
    pageTitle: 'Công thức',
    element: (
      <PagePlaceholder
        title="Công thức"
        description="Trang công thức đang chờ page riêng, nhưng route đã được cấu hình đúng vị trí."
      />
    ),
  },
  {
    path: ROUTES.OWNER.STAFF,
    pageTitle: 'Quản lý nhân viên',
    element: <StaffPage />,
  },
  {
    path: ROUTES.OWNER.STAFF_NEW,
    pageTitle: 'Thêm nhân viên mới',
    element: <CreateStaffPage />,
  },
  {
    path: ROUTES.OWNER.STAFF_POSITIONS,
    pageTitle: 'Quản lý chức vụ',
    element: <PositionsPage />,
  },
  {
    path: ROUTES.OWNER.STAFF_PERMISSIONS,
    pageTitle: 'Phân quyền',
    element: <PermissionsPage />,
  },
  {
    path: ROUTES.OWNER.SCHEDULES,
    pageTitle: 'Lịch làm việc',
    element: <ShiftManagementPage />,
  },
  {
    path: ROUTES.OWNER.BRANCHES,
    pageTitle: 'Quản lý chi nhánh',
    element: <BranchesPage />,
  },
  {
    path: ROUTES.OWNER.BRANCHES_NEW,
    pageTitle: 'Tạo chi nhánh mới',
    element: <CreateBranchPage />,
  },
  {
    path: `${ROUTES.OWNER.BRANCHES}/:id`,
    pageTitle: 'Chi tiết chi nhánh',
    element: <BranchDetailPage />,
  },
  {
    path: ROUTES.OWNER.PROMOTIONS,
    pageTitle: 'Khuyến mãi',
    element: (
      <PagePlaceholder
        title="Khuyến mãi"
        description="Trang khuyến mãi đang dùng placeholder để hoàn chỉnh hệ route trước."
      />
    ),
  },
  {
    path: ROUTES.OWNER.SUPPLIERS,
    pageTitle: 'Quản lý nhà cung cấp',
    element: <SuppliersPage />,
  },
  {
    path: `${ROUTES.OWNER.SUPPLIERS}/:id`,
    pageTitle: 'Chi tiết nhà cung cấp',
    element: <SupplierDetailPage />,
  },
  {
    path: ROUTES.OWNER.REPORTS,
    pageTitle: 'Báo cáo',
    element: (
      <PagePlaceholder
        title="Báo cáo"
        description="Khu vực báo cáo tổng hợp đang chờ page riêng nhưng route đã được set up đúng vị trí."
      />
    ),
  },
  {
    path: ROUTES.OWNER.SETTINGS,
    pageTitle: 'Cài đặt',
    element: (
      <PagePlaceholder
        title="Cài đặt"
        description="Trang cài đặt owner sẽ được triển khai ở file page riêng."
      />
    ),
  },
  {
    path: ROUTES.OWNER.PACKAGES,
    pageTitle: 'Gói dịch vụ',
    element: (
      <PagePlaceholder
        title="Gói dịch vụ"
        description="Trang gói dịch vụ đang dùng placeholder để hoàn thiện route map trước."
      />
    ),
  },
];

export const staffRoutes: RouteConfigItem[] = [
  {
    path: ROUTES.STAFF.DASHBOARD,
    pageTitle: 'Dashboard Nhân viên',
    element: (
      <PagePlaceholder
        title="Dashboard Nhân viên"
        description="Trang dashboard staff đang được tách riêng, route đã sẵn sàng theo đúng cấu trúc."
      />
    ),
  },
  {
    path: ROUTES.STAFF.TABLES,
    pageTitle: 'Bàn',
    element: (
      <PagePlaceholder
        title="Bàn"
        description="Trang thao tác bàn cho nhân viên đang được chuẩn hóa về page riêng."
      />
    ),
  },
  {
    path: ROUTES.STAFF.ORDERS,
    pageTitle: 'Đơn hàng',
    element: (
      <PagePlaceholder
        title="Đơn hàng"
        description="Trang đơn hàng staff đang được dựng lại theo flow role-based."
      />
    ),
  },
  {
    path: ROUTES.STAFF.MY_SHIFTS,
    pageTitle: 'Ca làm của tôi',
    element: (
      <PagePlaceholder
        title="Ca làm của tôi"
        description="Trang ca làm của nhân viên sẽ được thêm riêng ở bước triển khai module schedule."
      />
    ),
  },
  {
    path: ROUTES.STAFF.SHIFT_REGISTRATION,
    pageTitle: 'Đăng ký ca làm',
    element: <ShiftRegistrationPage />,
  },
  {
    path: ROUTES.STAFF.SUPPLIERS,
    pageTitle: 'Tra cứu nhà cung cấp',
    element: <StaffSupplierListPage />,
  },
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
