import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useCurrentSubscription } from '@modules/subscription/hooks/useCurrentSubscription';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { SubscriptionGateModal } from './SubscriptionGateModal';
import { ACTIVE_SUBSCRIPTION_STATUS, normalizeSubscriptionStatus, OWNER_SUBSCRIPTION_WHITELIST } from './subscriptionGate.utils';
import type { SubscriptionGateProps } from './subscriptionGate.types';

/**
 * Gate khóa các module nghiệp vụ khi subscription của tenant chưa ACTIVE.
 * Owner vẫn được vào trang gói dịch vụ để thanh toán/gia hạn.
 */
export const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role ?? state.session?.role);
  const {
    data: subscription,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCurrentSubscription();

  const isOwner = role === ROLES.OWNER;
  const isWhitelistedRoute = isOwner && OWNER_SUBSCRIPTION_WHITELIST.has(location.pathname);

  if (isWhitelistedRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <>{children}</>;
  }

  if (isError) {
    return (
      <>
        {children}
        <SubscriptionGateModal
          isOwner={isOwner}
          mode="error"
          isRetrying={isFetching}
          onOpenPackages={() => navigate(ROUTES.OWNER.PACKAGES)}
          onRetry={() => void refetch()}
        />
      </>
    );
  }

  const status = normalizeSubscriptionStatus(subscription?.status);

  if (status !== ACTIVE_SUBSCRIPTION_STATUS) {
    return (
      <>
        {children}
        <SubscriptionGateModal
          status={status}
          isOwner={isOwner}
          onOpenPackages={() => navigate(ROUTES.OWNER.PACKAGES)}
        />
      </>
    );
  }

  return <>{children}</>;
};
