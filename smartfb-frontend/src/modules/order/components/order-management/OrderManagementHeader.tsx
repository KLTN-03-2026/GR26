import { Plus, RefreshCcw, Search } from 'lucide-react';
import type { OrderStatus } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';
import { STATUS_TABS } from './orderManagement.utils';

interface SummaryCard {
  key: string;
  label: string;
  value: number;
  tone: string;
}

interface OrderManagementHeaderProps {
  isLoading: boolean;
  canCreateTakeaway: boolean;
  searchQuery: string;
  activeTab: OrderStatus | 'ALL';
  summaryCards: SummaryCard[];
  onRefresh: () => void;
  onCreateTakeaway: () => void;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: OrderStatus | 'ALL') => void;
}

export const OrderManagementHeader = ({
  isLoading,
  canCreateTakeaway,
  searchQuery,
  activeTab,
  summaryCards,
  onRefresh,
  onCreateTakeaway,
  onSearchChange,
  onTabChange,
}: OrderManagementHeaderProps) => {
  return (
    <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Quản lý đơn hàng</h1>
            <p className="text-sm text-slate-500">
              Theo dõi trạng thái đơn theo thời gian thực và thao tác nhanh ngay tại quầy.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canCreateTakeaway ? (
              <Button
                onClick={onCreateTakeaway}
                className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo đơn mang về
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-12 w-12 rounded-2xl border-slate-200"
            >
              <RefreshCcw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm mã đơn hoặc tên bàn..."
              className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-12 text-base focus-visible:ring-orange-500"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-[24px] bg-slate-50 p-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-orange-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.key} className={cn('rounded-[24px] px-5 py-4', card.tone)}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
