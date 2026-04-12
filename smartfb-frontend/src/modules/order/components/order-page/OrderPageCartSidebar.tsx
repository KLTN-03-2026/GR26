import type { ComponentProps } from 'react';

import { OrderCartPanel } from './OrderCartPanel';

interface OrderPageCartSidebarProps {
  showCart: boolean;
  cartPanelProps: ComponentProps<typeof OrderCartPanel>;
}

/**
 * Tách phần sidebar giỏ hàng desktop để page chỉ còn điều phối layout tổng thể.
 */
export const OrderPageCartSidebar = ({
  showCart,
  cartPanelProps,
}: OrderPageCartSidebarProps) => {
  if (!showCart) {
    return null;
  }

  return (
    <div className="hidden xl:block xl:w-[400px] 2xl:w-[440px]" aria-hidden="true">
      <div className="xl:fixed xl:right-8 xl:top-20 2xl:right-10">
        <OrderCartPanel
          {...cartPanelProps}
          className="xl:flex xl:h-[calc(100dvh-6rem)] xl:w-[400px] xl:max-h-[calc(100dvh-6rem)] 2xl:w-[440px]"
        />
      </div>
    </div>
  );
};
