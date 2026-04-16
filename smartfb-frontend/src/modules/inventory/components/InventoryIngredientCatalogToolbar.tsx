import { FlaskConical, Search } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';

interface InventoryIngredientCatalogToolbarProps {
  canCreateItem: boolean;
  ingredientsWithoutStockCount: number;
  onOpenCreateIngredient: () => void;
  onSearchChange: (value: string) => void;
  search: string;
  totalCatalogItems: number;
}

/**
 * Toolbar riêng cho tab danh mục nguyên liệu.
 * Chỉ tập trung vào tra cứu catalog thay vì thao tác tồn kho theo chi nhánh.
 */
export const InventoryIngredientCatalogToolbar = ({
  canCreateItem,
  ingredientsWithoutStockCount: _ingredientsWithoutStockCount,
  onOpenCreateIngredient,
  onSearchChange,
  search,
  totalCatalogItems: _totalCatalogItems,
}: InventoryIngredientCatalogToolbarProps) => {
  return (
    <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-md space-y-1">
          <Label htmlFor="ingredient-catalog-search">Tìm nguyên liệu trong danh mục</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              id="ingredient-catalog-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên, mã nguyên liệu hoặc đơn vị"
              className="pl-9"
            />
          </div>
        </div>

        {canCreateItem ? (
          <Button type="button" variant="outline" onClick={onOpenCreateIngredient}>
            <FlaskConical className="h-4 w-4" />
            Thêm nguyên liệu
          </Button>
        ) : null}
      </div>
    </div>
  );
};
