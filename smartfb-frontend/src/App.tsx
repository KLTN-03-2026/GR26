import { AdminLayout, AppLayout } from '@layouts';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { Suspense, type ReactNode } from 'react';
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

const EMPTY_PERMISSIONS: string[] = [];

const RouteLoadingFallback = () => (
  <div className="flex min-h-[320px] items-center justify-center bg-cream text-sm font-medium text-text-secondary">
    Đang tải trang...
  </div>
);

const withRouteSuspense = (element: ReactNode) => (
  <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
);

const renderProtectedRoutes = (
  routes: RouteConfigItem[],
  allowedRoles: typeof ROLES[keyof typeof ROLES][],
  layout: 'admin' | 'app'
) => {
  return routes.map(({ path, element, pageTitle, requiredPermissions }) => {
    const wrappedElement =
      layout === 'admin' ? (
        <AdminLayout pageTitle={pageTitle}>{withRouteSuspense(element)}</AdminLayout>
      ) : (
        <AppLayout pageTitle={pageTitle}>{withRouteSuspense(element)}</AppLayout>
      );

    return (
      <Route
        key={path}
        path={path}
        element={
          <ProtectedRoute
            allowedRoles={allowedRoles}
            requiredPermissions={requiredPermissions}
          >
            {wrappedElement}
          </ProtectedRoute>
        }
      />
    );
  });
};

const renderPosRouteElement = (route: RouteConfigItem) => {
  return <AppLayout pageTitle={route.pageTitle}>{withRouteSuspense(route.element)}</AppLayout>;
};

/**
 * App shell chịu trách nhiệm mount hệ thống routes.
 */
function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role ?? state.session?.role);
  const permissions =
    useAuthStore((state) => state.session?.permissions) ?? EMPTY_PERMISSIONS;

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-[#7a7a7a]">
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }

  const fallbackRoute =
    isAuthenticated && currentRole ? getRoleHomePage(currentRole, permissions) : ROUTES.LOGIN;

  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PublicRoute>{withRouteSuspense(element)}</PublicRoute>}
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
            <ProtectedRoute
              allowedRoles={[ROLES.OWNER, ROLES.STAFF]}
              requiredPermissions={route.requiredPermissions}
            >
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
