import { Plus, Search } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';

interface ExpenseFilterBarProps {
  categoryKeyword: string;
  onCategoryKeywordChange: (value: string) => void;
  onCreateExpense: () => void;
  canManageExpenses: boolean;
  isCreateDisabled: boolean;
}

/**
 * Thanh filter đơn giản cho màn hình chi tiêu.
 */
export const ExpenseFilterBar = ({
  categoryKeyword,
  onCategoryKeywordChange,
  onCreateExpense,
  canManageExpenses,
  isCreateDisabled,
}: ExpenseFilterBarProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={categoryKeyword}
          onChange={(event) => onCategoryKeywordChange(event.target.value)}
          placeholder="Tìm theo danh mục chi"
          className="pl-10"
        />
      </div>

      {canManageExpenses ? (
        <Button onClick={onCreateExpense} disabled={isCreateDisabled} className="md:self-end">
          <Plus className="h-4 w-4" />
          Tạo phiếu chi
        </Button>
      ) : null}
    </div>
  );
};
