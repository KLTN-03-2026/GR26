import { FlaskConical, Hammer, PackagePlus, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

interface InventoryToolbarProps {
  search: string;
  searchLabel: string;
  searchPlaceholder: string;
  branchId: string;
  lowStockOnly: boolean;
  branchOptions: Array<{ id: string; name: string }>;
  canFilterByBranch: boolean;
  canImport: boolean;
  canAdjust: boolean;
  canWaste: boolean;
  canRecordProduction?: boolean;
  canCreateItem: boolean;
  createItemLabel: string;
  importActionLabel?: string;
  productionActionLabel?: string;
  isActionLocked: boolean;
  isSwitchingBranch: boolean;
  actionHint?: string | null;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onLowStockChange: (value: string) => void;
  onOpenImport: () => void;
  onOpenAdjust: () => void;
  onOpenWaste: () => void;
  onOpenProduction?: () => void;
  onOpenCreateIngredient: () => void;
}

/**
 * Thanh công cụ thao tác và lọc dữ liệu kho.
 */
export const InventoryToolbar = ({
  search,
  searchLabel,
  searchPlaceholder,
  branchId,
  lowStockOnly,
  branchOptions,
  canFilterByBranch,
  canImport,
  canAdjust,
  canWaste,
  canRecordProduction = false,
  canCreateItem,
  createItemLabel,
  importActionLabel = 'Nhập kho',
  productionActionLabel = 'Ghi nhận sản xuất',
  isActionLocked,
  isSwitchingBranch,
  actionHint,
  onSearchChange,
  onBranchChange,
  onLowStockChange,
  onOpenImport,
  onOpenAdjust: _onOpenAdjust,
  onOpenWaste,
  onOpenProduction,
  onOpenCreateIngredient,
}: InventoryToolbarProps) => {
  return (
    <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className=" flex gap-3 flex-wrap  items-end ">
          <div className="space-y-1 w-xs max-w-md">
            <Label htmlFor="inventory-search">{searchLabel}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                id="inventory-search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="inventory-branch-filter">Chi nhánh</Label>
            <Select value={branchId} onValueChange={onBranchChange} disabled={!canFilterByBranch}>
              <SelectTrigger id="inventory-branch-filter" className="w-[170px]">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {canFilterByBranch ? <SelectItem value="all">Tất cả chi nhánh</SelectItem> : null}
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canFilterByBranch ? (
              <p className="text-xs text-text-secondary">Nhân viên xem tồn kho theo chi nhánh đang làm việc.</p>
            ) : null}
          </div>

          <div className="space-y-1 text-nowrap w-fit">
            <Label htmlFor="inventory-stock-filter">Trạng thái</Label>
            <Select
              value={lowStockOnly ? 'low-stock' : 'all'}
              onValueChange={onLowStockChange}
              
            >
              <SelectTrigger id="inventory-stock-filter" className="w-fit">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className='px-2' value="all">Tất cả</SelectItem>
                <SelectItem className='px-2' value="low-stock">Sắp hết</SelectItem>
              </SelectContent>
            </Select>
          </div>
 

          {canCreateItem && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenCreateIngredient}
            >
              <FlaskConical className="h-4 w-4" />
              {createItemLabel}
            </Button>
          )}

          {canWaste && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenWaste}
              disabled={isActionLocked || isSwitchingBranch}
            >
              <ShieldAlert className="h-4 w-4" />
              Ghi hao hụt
            </Button>
          )}

          {canImport && (
            <>
              {canRecordProduction && onOpenProduction ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenProduction}
                  disabled={isActionLocked || isSwitchingBranch}
                >
                  <Hammer className="h-4 w-4" />
                  {productionActionLabel}
                </Button>
              ) : null}

              <Button
                type="button"
                onClick={onOpenImport}
                disabled={isActionLocked || isSwitchingBranch}
              >
                <PackagePlus className="h-4 w-4" />
                {importActionLabel}
              </Button>
            </>
          )}
        </div>
      </div>

      {actionHint ? (
        <div className="rounded-card border border-border bg-cream px-3 py-2 text-sm text-text-secondary">
          {isSwitchingBranch ? 'Đang đồng bộ chi nhánh thao tác...' : actionHint}
        </div>
      ) : null}

      {!canImport && !canAdjust && !canWaste && (
        <div className="rounded-card border border-border bg-cream px-3 py-2 text-sm text-text-secondary">
          Tài khoản hiện tại chỉ có quyền xem tồn kho.
        </div>
      )}
    </div>
  );
};
