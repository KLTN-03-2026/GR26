import { type FC, useState } from "react";
import { ImageOff, MoreHorizontal } from "lucide-react";
import { formatVND } from "@shared/utils/formatCurrency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Button } from "@shared/components/ui/button";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { GpToggle } from "./GpToggle";
import type { MenuItem } from "@modules/menu/types/menu.types";

interface MenuCardProps {
  menu: MenuItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (menu: MenuItem, isAvailable: boolean) => void;
  onConfigureBranch?: (menu: MenuItem) => void;
  isBranchMode?: boolean;
  isBranchLoading?: boolean;
}

export const MenuCard: FC<MenuCardProps> = ({
  menu,
  onEdit,
  onDelete,
  onToggle,
  onConfigureBranch,
  isBranchMode = false,
  isBranchLoading = false,
}) => {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const hasBranchOverride = menu.usesBranchPrice === true;
  const effectivePrice = menu.effectivePrice ?? menu.price;
  const basePrice = menu.basePrice ?? menu.price;
  const shouldShowImage = Boolean(menu.image) && menu.image !== failedImageSrc;

  return (
    <div className="flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {shouldShowImage ? (
          <img
            src={menu.image}
            alt={menu.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailedImageSrc(menu.image)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-amber-700 shadow-sm">
                <ImageOff className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-amber-700">SmartF&B</p>
              <p className="mt-1 text-xs text-amber-600">
                {menu.image ? 'Không tải được ảnh món' : 'Chưa có ảnh món'}
              </p>
            </div>
          </div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <ProductStatusBadge status={menu.status} />
        </div>

        {/* Trạng thái đồng bộ app giao hàng */}
        {menu.isSyncDelivery && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-amber-700">
              Đồng bộ giao hàng
            </span>
          </div>
        )}

        {/* Action Menu - Top Right */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isBranchMode && onConfigureBranch ? (
                <DropdownMenuItem
                  onClick={() => onConfigureBranch(menu)}
                  disabled={isBranchLoading}
                >
                  Thiết lập chi nhánh
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onEdit(menu.id)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(menu.id)}
                className="text-red-600"
              >
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <span className="text-xs text-gray-500">
          {menu.categoryName || "Chưa phân loại"}
        </span>

        {isBranchMode && menu.branchName ? (
          <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            {hasBranchOverride ? `Giá riêng tại ${menu.branchName}` : `Dùng giá gốc tại ${menu.branchName}`}
          </span>
        ) : null}

        <div className="flex items-start gap-2">
          {/* Product Name */}
          <h3 className="mt-1 min-h-10 font-sans text-sm font-semibold text-gray-900 line-clamp-2 md:min-h-12 md:text-lg">
            {menu.name}
          </h3>

          {/* {menu.unit ? (
            <p className="mt-1 text-sm text-gray-500">({menu.unit})</p>
          ) : null} */}
        </div>

        {/* Giá bán và công tắc bật/tắt bán */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">
              {isBranchMode ? 'GIÁ ÁP DỤNG' : 'GIÁ BÁN'}
            </span>
            <span className="text-lg font-bold text-amber-600">
              {formatVND(effectivePrice)}
            </span>
            {isBranchMode ? (
              <span className="mt-1 text-xs text-gray-500">
                Giá gốc: {formatVND(basePrice)}
              </span>
            ) : null}
          </div>
          <GpToggle
            isAvailable={menu.isAvailable ?? true}
            onToggle={(isAvailable) => onToggle(menu, isAvailable)}
            disabled={isBranchLoading}
          />
        </div>
      </div>
    </div>
  );
};
