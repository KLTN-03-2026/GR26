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

const renderPosRouteElement = (route: RouteConfigItem) => {
  return <AppLayout pageTitle={route.pageTitle}>{route.element}</AppLayout>;
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
      
      {/* POS Routes - Owner/Staff dùng chung app shell để giữ sidebar và header nhất quán */}
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
