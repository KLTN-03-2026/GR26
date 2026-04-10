import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useDeleteAddon } from "@modules/menu/hooks/useDeleteAddon";
import { useUpdateAddon } from "@modules/menu/hooks/useUpdateAddon";
import type { MenuAddonInfo } from "@modules/menu/types/menu.types";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { formatVND } from "@shared/utils/formatCurrency";
import { cn } from "@shared/utils/cn";

interface AddonListProps {
  addons: MenuAddonInfo[];
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  onRetry: () => void;
  onEditAddon: (addon: MenuAddonInfo) => void;
}

/**
 * Danh sách topping hiện có trong hệ thống menu.
 */
export const AddonList = ({
  addons,
  isLoading,
  isError,
  isFetching = false,
  onRetry,
  onEditAddon,
}: AddonListProps) => {
  const [addonToDelete, setAddonToDelete] = useState<MenuAddonInfo | null>(
    null,
  );
  const { mutate: updateAddon, isPending: isUpdatingAddon } = useUpdateAddon();
  const { mutate: deleteAddon, isPending: isDeletingAddon } = useDeleteAddon();

  const sortedAddons = useMemo(() => {
    return [...addons].sort((left, right) => {
      if ((left.isActive !== false) !== (right.isActive !== false)) {
        return left.isActive === false ? 1 : -1;
      }

      if (left.extraPrice !== right.extraPrice) {
        return left.extraPrice - right.extraPrice;
      }

      return left.name.localeCompare(right.name, "vi");
    });
  }, [addons]);

  const activeCount = useMemo(() => {
    return addons.filter((addon) => addon.isActive !== false).length;
  }, [addons]);

  const handleToggleAddonStatus = (addon: MenuAddonInfo) => {
    updateAddon({
      id: addon.id,
      currentAddon: addon,
      payload: {
        name: addon.name,
        extraPrice: addon.extraPrice,
        isActive: addon.isActive === false,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!addonToDelete) {
      return;
    }

    deleteAddon(
      {
        id: addonToDelete.id,
        name: addonToDelete.name,
      },
      {
        onSuccess: () => {
          setAddonToDelete(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`addon-skeleton-${index}`}
            className="h-32 animate-pulse rounded-2xl bg-amber-50"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/60 px-6 text-center">
        <p className="text-sm font-medium text-red-700">
          Không thể tải danh sách topping
        </p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Tải lại
        </Button>
      </div>
    );
  }

  if (sortedAddons.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
        <p className="text-sm font-medium text-amber-900">
          Chưa có topping nào
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900">
            Danh sách topping
            <span className="ml-2 text-sm font-normal text-gray-500">
              {sortedAddons.length} mục, {activeCount} đang bật
            </span>
          </h3>
          {isFetching ? (
            <span className="text-sm text-gray-500">Đang đồng bộ...</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {sortedAddons.map((addon) => {
            const isInactive = addon.isActive === false;
            const cardToneClassName = isInactive
              ? "border-rose-200 bg-red-50/90"
              : "border-sky-200 bg-sky-50/85";
            const badgeToneClassName = isInactive
              ? "bg-rose-100 text-rose-700"
              : "bg-sky-100 text-sky-700";

            return (
              <article
                key={addon.id}
                className={cn(
                  "flex min-h-40 flex-col rounded-2xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4",
                  cardToneClassName,
                )}
              >
                <div className="flex flex-col items-start  gap-2 sm:gap-3">
                  <div className="min-w-0 w-full flex  justify-between space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                          badgeToneClassName,
                        )}
                      >
                        {isInactive ? "Đang ẩn" : "Đang dùng"}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white/80"
                          disabled={isUpdatingAddon || isDeletingAddon}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            onEditAddon(addon);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            handleToggleAddonStatus(addon);
                          }}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {isInactive ? "Kích hoạt lại" : "Vô hiệu hóa"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700"
                          onSelect={(event) => {
                            event.preventDefault();
                            setAddonToDelete(addon);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa topping
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                      {addon.name}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-end gap-3 pt-4">
                  
                  <p className="text-left text-base font-bold text-sky-700 sm:text-lg">
                    {formatVND(addon.extraPrice)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Dialog
        open={Boolean(addonToDelete)}
        onOpenChange={(open) => !open && setAddonToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa topping</DialogTitle>
            <DialogDescription>
              {addonToDelete
                ? `Bạn sắp xóa topping "${addonToDelete.name}".`
                : "Xác nhận xóa topping đã chọn."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setAddonToDelete(null)}
              disabled={isDeletingAddon}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingAddon}
            >
              {isDeletingAddon ? "Đang xóa..." : "Xóa topping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
