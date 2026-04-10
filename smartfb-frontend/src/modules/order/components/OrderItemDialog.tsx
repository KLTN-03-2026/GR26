import { useMemo, useState } from 'react';
import { Check, Minus, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { MenuAddonInfo, MenuItem } from '@modules/menu/types/menu.types';
import type { OrderAddonSelection, OrderDraftItem } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';

interface OrderItemDialogProps {
  open: boolean;
  menuItem: MenuItem | null;
  initialItem?: OrderDraftItem | null;
  addons: MenuAddonInfo[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    quantity: number;
    notes: string;
    addons: OrderAddonSelection[];
  }) => Promise<void> | void;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop';

/**
 * Dialog cấu hình món trước khi ghi vào đơn.
 * Giữ layout ảnh vuông + thông tin ngang để sát mockup nghiệp vụ.
 */
export const OrderItemDialog = ({
  open,
  menuItem,
  initialItem,
  addons,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: OrderItemDialogProps) => {
  const [quantity, setQuantity] = useState(initialItem?.quantity ?? 1);
  const [notes, setNotes] = useState(initialItem?.notes ?? '');
  const [selectedAddons, setSelectedAddons] = useState<OrderAddonSelection[]>(
    initialItem?.addons ?? []
  );

  const addonPerUnitTotal = useMemo(() => {
    return selectedAddons.reduce(
      (sum, addon) => sum + addon.extraPrice * addon.quantity,
      0
    );
  }, [selectedAddons]);

  const lineTotal = useMemo(() => {
    if (!menuItem) {
      return 0;
    }

    return (menuItem.price + addonPerUnitTotal) * quantity;
  }, [addonPerUnitTotal, menuItem, quantity]);

  const selectedAddonCount = useMemo(() => {
    return selectedAddons.reduce((sum, addon) => sum + addon.quantity, 0);
  }, [selectedAddons]);

  const updateAddonQuantity = (addon: MenuAddonInfo, delta: number) => {
    setSelectedAddons((currentAddons) => {
      const existingAddon = currentAddons.find(
        (selectedAddon) => selectedAddon.addonId === addon.id
      );

      if (!existingAddon && delta < 0) {
        return currentAddons;
      }

      if (!existingAddon) {
        return [
          ...currentAddons,
          {
            addonId: addon.id,
            addonName: addon.name,
            extraPrice: addon.extraPrice,
            quantity: 1,
          },
        ];
      }

      const nextQuantity = existingAddon.quantity + delta;

      if (nextQuantity <= 0) {
        return currentAddons.filter(
          (selectedAddon) => selectedAddon.addonId !== addon.id
        );
      }

      return currentAddons.map((selectedAddon) =>
        selectedAddon.addonId === addon.id
          ? {
              ...selectedAddon,
              quantity: nextQuantity,
            }
          : selectedAddon
      );
    });
  };

  const handleSubmit = async () => {
    if (!menuItem) {
      return;
    }

    await onSubmit({
      quantity,
      notes: notes.trim(),
      addons: selectedAddons,
    });
  };

  if (!menuItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[780px] rounded-[32px] border-none p-0 shadow-2xl">
        <DialogTitle className="sr-only">{menuItem.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Chọn số lượng, topping và ghi chú cho món.
        </DialogDescription>

        <div className="flex flex-col overflow-hidden rounded-[32px] bg-white">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-[24px] bg-slate-100">
                <img
                  src={menuItem.image || DEFAULT_IMAGE}
                  alt={menuItem.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-500 shadow-sm">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Tùy chỉnh món
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {menuItem.name}
                    </h2>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">
                      {menuItem.description || 'Chưa có mô tả cho món này.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Giá bán</p>
                    <p className="text-3xl font-black text-slate-900">
                      {formatVND(menuItem.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-full border border-orange-100 bg-white px-3 py-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-xl font-black text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex max-h-[52vh] flex-col gap-5 overflow-y-auto p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    Topping thêm
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedAddonCount > 0
                      ? `Đã chọn ${selectedAddonCount} topping cho mỗi phần`
                      : 'Chưa chọn topping'}
                  </p>
                </div>
                {selectedAddonCount > 0 && (
                  <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-500">
                    {selectedAddonCount} đã chọn
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200">
                {addons.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-400">
                    Món này hiện chưa có topping áp dụng.
                  </div>
                ) : (
                  addons.map((addon, index) => {
                    const selectedAddon = selectedAddons.find(
                      (item) => item.addonId === addon.id
                    );

                    return (
                      <div
                        key={addon.id}
                        className={cn(
                          'flex items-center justify-between gap-4 px-4 py-4',
                          index !== addons.length - 1 && 'border-b border-slate-100',
                          selectedAddon && 'bg-orange-50/50'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full border',
                              selectedAddon
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-slate-200 text-transparent'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {addon.name}
                            </p>
                            <p className="text-sm font-medium text-orange-500">
                              +{formatVND(addon.extraPrice)}
                            </p>
                          </div>
                        </div>

                        {selectedAddon ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateAddonQuantity(addon, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-orange-200 hover:text-orange-500"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-sm font-black text-slate-800">
                              {selectedAddon.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateAddonQuantity(addon, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500 bg-orange-500 text-white transition-colors hover:bg-orange-600"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateAddonQuantity(addon, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-orange-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

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
                className="min-h-24 rounded-[24px] border-slate-200 bg-slate-50 px-4 py-3 focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div>
                  <p className="font-bold uppercase tracking-[0.16em] text-slate-400">
                    Món x{quantity}
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {formatVND(menuItem.price * quantity)}
                  </p>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-[0.16em] text-slate-400">
                    Tổng cộng
                  </p>
                  <p className="mt-1 text-2xl font-black text-orange-500">
                    {formatVND(lineTotal)}
                  </p>
                </div>
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
                    ? 'Đang cập nhật...'
                    : initialItem
                      ? 'Cập nhật món'
                      : 'Thêm vào đơn'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
