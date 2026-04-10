import { useAuthStore } from '@modules/auth/stores/authStore';
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { ROUTES } from '@shared/constants/routes';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * Guard cho các route công khai như đăng nhập và đăng ký.
 * Nếu đã có phiên đăng nhập thì chuyển người dùng về trang chính theo role.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role);

  if (isAuthenticated && currentRole) {
    return <Navigate to={getRoleHomePage(currentRole)} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};
