import type { ReactNode } from 'react';

export interface SubscriptionGateProps {
  children: ReactNode;
}

export interface SubscriptionBlockedStateProps {
  status?: string;
  isOwner: boolean;
  onOpenPackages: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  mode?: 'blocked' | 'error';
}
