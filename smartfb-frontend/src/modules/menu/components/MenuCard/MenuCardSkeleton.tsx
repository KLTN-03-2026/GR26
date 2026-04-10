import { cn } from '@shared/utils/cn';

interface MenuCardSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton cho Menu Card
 */
export const MenuCardSkeleton = ({ className }: MenuCardSkeletonProps) => {
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white', className)}>
      {/* Image Skeleton */}
      <div className="aspect-[3/4] animate-pulse bg-gray-200 md:aspect-[4/3]" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        {/* Category */}
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />

        {/* Product Name */}
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />

        {/* Price and GP Toggle */}
        <div className="mt-auto flex items-center justify-between pt-4">
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
