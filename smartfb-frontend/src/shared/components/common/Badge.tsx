import * as React from "react"
import { cn } from "@shared/utils/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'processing' | 'completed' | 'cancelled' | 'success' | 'warning' | 'danger';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  // Map variant to CSS classes defined in index.css
  const variantClass = variant === 'default' ? 'badge-processing' : `badge-${variant}`;

  return (
    <div
      className={cn(
        "badge", // Base class from index.css
        variantClass,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
