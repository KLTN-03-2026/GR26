import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { MenuItem } from "@modules/menu/types/menu.types";
import type { OrderDraftItem } from "@modules/order/types/order.types";
import { OrderQuantityInput } from "@modules/order/components/OrderQuantityInput";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Textarea } from "@shared/components/ui/textarea";
import { formatVND } from "@shared/utils/formatCurrency";

interface OrderItemDialogProps {
  open: boolean;
  menuItem: MenuItem | null;
  initialItem?: OrderDraftItem | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    quantity: number;
    notes: string;
  }) => Promise<void> | void;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop";

/**
 * Dialog cấu hình món trước khi ghi vào đơn.
 * Giữ layout ảnh vuông + thông tin ngang để sát mockup nghiệp vụ.
 */
export const OrderItemDialog = ({
  open,
  menuItem,
  initialItem,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: OrderItemDialogProps) => {
  const [quantity, setQuantity] = useState(initialItem?.quantity ?? 1);
  const [notes, setNotes] = useState(initialItem?.notes ?? "");

  const lineTotal = useMemo(() => {
    if (!menuItem) {
      return 0;
    }

    return menuItem.price * quantity;
  }, [menuItem, quantity]);

  const handleSubmit = async () => {
    if (!menuItem) {
      return;
    }

    await onSubmit({
      quantity,
      notes: notes.trim(),
    });
  };

  if (!menuItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[780px] rounded-2xl border-none p-0 shadow-2xl">
        <DialogTitle className="sr-only">{menuItem.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Chọn số lượng và ghi chú cho món.
        </DialogDescription>

        <div className="flex flex-col overflow-hidden rounded-xl bg-white">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={menuItem.image || DEFAULT_IMAGE}
                  alt={menuItem.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    {menuItem.name}
                  </h2>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">
                    {menuItem.description || "Chưa có mô tả cho món này."}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Giá bán
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {formatVND(menuItem.price)}
                    </p>
                  </div>

                  <OrderQuantityInput
                    value={quantity}
                    disabled={isSubmitting}
                    containerClassName="border-orange-100 bg-white px-3 py-2 shadow-sm"
                    inputClassName="h-10 w-16 text-xl"
                    decreaseButtonClassName="h-10 w-10 border border-slate-200 bg-white hover:border-orange-200 hover:bg-white hover:text-orange-500"
                    increaseButtonClassName="h-10 w-10 bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
                    onCommit={(nextQuantity) => setQuantity(Math.max(1, nextQuantity))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex max-h-[52vh] flex-col gap-5 overflow-y-auto p-6">
            <div className="space-y-3">
              <label
                htmlFor="order-item-note"
                className="text-sm font-black uppercase tracking-[0.2em] text-slate-400"
              >
                Ghi chú món
              </label>
              <Textarea
                id="order-item-note"
                placeholder="Ví dụ: ít đá, ít ngọt, mang ra sau..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus-visible:ring-orange-500 resize-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold uppercase tracking-[0.16em] text-slate-400">
                  Tổng cộng
                </p>
                <p className="mt-1 text-2xl font-black text-orange-500">
                  {formatVND(lineTotal)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {initialItem && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full border-slate-200 px-5"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Đóng
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  className="h-14 rounded-full bg-orange-500 px-8 text-base font-bold hover:bg-orange-600"
                >
                  {isSubmitting
                    ? "Đang cập nhật..."
                    : initialItem
                      ? "Cập nhật món"
                      : "Thêm vào đơn"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
