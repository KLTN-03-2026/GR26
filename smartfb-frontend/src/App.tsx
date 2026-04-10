import { AdminLayout, AppLayout } from '@layouts';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  adminRoutes,
  ownerRoutes,
  posRoutes,
  ProtectedRoute,
  PublicRoute,
  publicRoutes,
  staffRoutes,
  type RouteConfigItem,
} from './routes';

const renderProtectedRoutes = (
  routes: RouteConfigItem[],
  allowedRoles: typeof ROLES[keyof typeof ROLES][],
  layout: 'admin' | 'app'
) => {
  return routes.map(({ path, element, pageTitle }) => {
    const wrappedElement =
      layout === 'admin' ? (
        <AdminLayout pageTitle={pageTitle}>{element}</AdminLayout>
      ) : (
        <AppLayout pageTitle={pageTitle}>{element}</AppLayout>
      );

    return (
      <Route
        key={path}
        path={path}
        element={
          <ProtectedRoute allowedRoles={allowedRoles}>
            {wrappedElement}
          </ProtectedRoute>
        }
      />
    );
  });
};

/**
 * Màn quản lý đơn hàng cần hiển thị trong shell Owner/Staff
 * để dùng chung sidebar và header thay vì layout POS full-screen.
 */
const renderPosRouteElement = (route: RouteConfigItem) => {
  if (route.path === ROUTES.POS_MANAGEMENT) {
    return <AppLayout pageTitle={route.pageTitle}>{route.element}</AppLayout>;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#faf7f2] p-4 font-sans antialiased text-slate-900">
      {route.element}
    </div>
  );
};

/**
 * App shell chịu trách nhiệm mount hệ thống routes.
 */
function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-[#7a7a7a]">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }

  const fallbackRoute =
    isAuthenticated && currentRole ? getRoleHomePage(currentRole) : ROUTES.LOGIN;

  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PublicRoute>{element}</PublicRoute>}
        />
      ))}

      {renderProtectedRoutes(adminRoutes, [ROLES.ADMIN], 'admin')}
      {renderProtectedRoutes(ownerRoutes, [ROLES.OWNER], 'app')}
      {renderProtectedRoutes(staffRoutes, [ROLES.STAFF], 'app')}
      
      {/* POS Routes - Màn quản lý đơn hàng dùng chung app shell, các màn POS khác giữ full-screen */}
      {posRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.STAFF]}>
              {renderPosRouteElement(route)}
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
    </Routes>
  );
}

export default App;
