import type { ComponentProps } from 'react';
import { PanelRightClose, PanelRightOpen, ShoppingCart } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shared/components/ui/sheet';

import { OrderCartPanel } from './OrderCartPanel';

interface OrderPageCartActionsProps {
  showCart: boolean;
  totalItemCount: number;
  isCartSheetOpen: boolean;
  onCartSheetOpenChange: (open: boolean) => void;
  onToggleCart: () => void;
  cartPanelProps: ComponentProps<typeof OrderCartPanel>;
}

/**
 * Gom nhóm thao tác giỏ hàng trên toolbar để `OrderPage` không phải giữ cả phần sheet mobile lẫn nút toggle desktop.
 */
export const OrderPageCartActions = ({
  showCart,
  totalItemCount,
  isCartSheetOpen,
  onCartSheetOpenChange,
  onToggleCart,
  cartPanelProps,
}: OrderPageCartActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={isCartSheetOpen} onOpenChange={onCartSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-full border-slate-200 px-4 text-slate-700 xl:hidden"
          >
            <ShoppingCart className="h-4 w-4" />
            Xem giỏ hàng
            {totalItemCount > 0 ? ` (${totalItemCount})` : ''}
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-[calc(100vw-1rem)] max-w-md overflow-y-auto border-l bg-white p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Giỏ hàng hiện tại</SheetTitle>
          </SheetHeader>

          <OrderCartPanel
            {...cartPanelProps}
            className="h-full rounded-none border-0 shadow-none xl:max-h-none"
          />
        </SheetContent>
      </Sheet>

      <Button
        variant="outline"
        onClick={onToggleCart}
        className="hidden h-11 gap-2 rounded-2xl border-slate-200 px-4 text-slate-700 xl:inline-flex"
      >
        {showCart ? (
          <>
            <PanelRightClose className="h-4 w-4" />
              {totalItemCount > 0 ? ` (${totalItemCount})` : ''}
          </>
        ) : (
          <>
            <PanelRightOpen className="h-4 w-4" />
            
            {totalItemCount > 0 ? ` (${totalItemCount})` : ''}
          </>
        )}
      </Button>
    </div>
  );
};
