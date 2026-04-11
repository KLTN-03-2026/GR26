import { useAuthStore } from '@modules/auth/stores/authStore';
import { PagePlaceholder } from '@shared/components/common/PagePlaceholder';
import { ROUTES } from '@shared/constants/routes';
import type { Role } from '@shared/constants/roles';
import { hasAccess } from '@shared/utils/accessControl';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredPermissions?: readonly string[];
}

const EMPTY_PERMISSIONS: string[] = [];

/**
 * Guard ở mức route.
 * Chỉ cho phép truy cập khi đã đăng nhập và đúng role được cấu hình.
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermissions,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role ?? state.session?.role);
  const permissions =
    useAuthStore((state) => state.session?.permissions) ?? EMPTY_PERMISSIONS;

  if (!isAuthenticated || !currentRole) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  const fallbackRoute = getRoleHomePage(currentRole, permissions);

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (
    !hasAccess(
      { role: currentRole, permissions },
      {
        roles: allowedRoles,
        requiredPermissions: requiredPermissions ? [...requiredPermissions] : undefined,
      }
    )
  ) {
    // Khi route fallback cũng chính là route đang bị chặn,
    // thay vì redirect lặp vô hạn sẽ hiển thị thông báo rõ ràng cho user.
    if (location.pathname === fallbackRoute) {
      return (
        <PagePlaceholder
          title="Chưa được cấp quyền truy cập"
          description="Tài khoản hiện tại chưa có quyền mở trang mặc định. Hãy kiểm tra lại role, permission hoặc chi nhánh làm việc của nhân viên."
        />
      );
    }

    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
};
