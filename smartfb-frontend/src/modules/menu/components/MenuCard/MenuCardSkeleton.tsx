import { cn } from '@shared/utils/cn';

interface MenuCardSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton cho Menu Card
 */
export const MenuCardSkeleton = ({ className }: MenuCardSkeletonProps) => {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />

        {/* Product Name */}
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />

        {/* Price and GP Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
