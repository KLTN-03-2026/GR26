import { Search } from 'lucide-react';
import { Input } from '@shared/components/ui/input';

interface OrderPageToolbarProps {
  searchKeyword: string;
  tableName: string;
  onSearchKeywordChange: (value: string) => void;
}

export const OrderPageToolbar = ({
  searchKeyword,
  tableName,
  onSearchKeywordChange,
}: OrderPageToolbarProps) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-400">
            Đơn hàng <span className="mx-1">›</span> Tạo đơn mới
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center xl:w-auto">
          <div className="relative w-full min-w-[280px] xl:min-w-[340px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm món ăn, đồ uống..."
              className="h-12 rounded-full border-slate-200 bg-slate-50 pl-12 focus-visible:ring-orange-500"
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
            />
          </div>

          <div className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-bold text-slate-700">
            <span className="mr-2 h-2.5 w-2.5 rounded-full bg-orange-500" />
            {tableName}
          </div>
        </div>
      </div>
    </div>
  );
};
