import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROUTES } from '@shared/constants/routes';
import type { Role } from '@shared/constants/roles';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

/**
 * Guard ở mức route.
 * Chỉ cho phép truy cập khi đã đăng nhập và đúng role được cấu hình.
 */
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role);

  if (!isAuthenticated || !currentRole) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to={getRoleHomePage(currentRole)} replace />;
  }

  return <>{children}</>;
};
