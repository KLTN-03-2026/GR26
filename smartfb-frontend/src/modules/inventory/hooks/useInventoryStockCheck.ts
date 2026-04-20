import { useCallback, useMemo, useState } from 'react';
import { useInventoryBalances } from './useInventoryBalances';
import { useAdjustStock } from './useAdjustStock';
import type { StockCheckEntry } from '../types/inventory.types';

/**
 * Hook quản lý state và logic cho trang kiểm kho.
 * Người dùng nhập số lượng thực tế, save từng dòng → gọi adjust API.
 */
export const useInventoryStockCheck = () => {
  const { data, isLoading, isError, refetch } = useInventoryBalances();
  const { mutateAsync: adjustStock } = useAdjustStock();

  // Map itemId → entry để track dirty state và saving state riêng từng dòng
  const [entries, setEntries] = useState<Record<string, StockCheckEntry>>({});

  // Build initial entries từ balances (reset khi data thay đổi)
  const checkEntries = useMemo<StockCheckEntry[]>(() => {
    const balances = data?.data ?? [];

    return balances.map((balance) => {
      const existing = entries[balance.id];
      return (
        existing ?? {
          balanceId: balance.id,
          itemId: balance.itemId,
          itemName: balance.itemName,
          unit: balance.unit,
          currentQuantity: balance.quantity,
          actualQuantity: '',
          isDirty: false,
          isSaving: false,
        }
      );
    });
  }, [data?.data, entries]);

  const handleQuantityChange = useCallback((balanceId: string, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [balanceId]: {
        ...(prev[balanceId] ?? checkEntries.find((e) => e.balanceId === balanceId)!),
        actualQuantity: value,
        isDirty: true,
      },
    }));
  }, [checkEntries]);

  const handleSaveEntry = useCallback(
    async (entry: StockCheckEntry) => {
      const parsed = parseFloat(entry.actualQuantity);
      if (isNaN(parsed) || parsed < 0) return;

      setEntries((prev) => ({
        ...prev,
        [entry.balanceId]: { ...prev[entry.balanceId]!, isSaving: true },
      }));

      try {
        await adjustStock({
          itemId: entry.itemId,
          newQuantity: parsed,
          reason: 'Kiểm kho — cập nhật số lượng thực tế',
        });

        // Sau khi lưu thành công, reset dirty state
        setEntries((prev) => ({
          ...prev,
          [entry.balanceId]: {
            ...prev[entry.balanceId]!,
            isSaving: false,
            isDirty: false,
            currentQuantity: parsed,
            actualQuantity: '',
          },
        }));
      } catch {
        setEntries((prev) => ({
          ...prev,
          [entry.balanceId]: { ...prev[entry.balanceId]!, isSaving: false },
        }));
      }
    },
    [adjustStock],
  );

  const dirtyCount = checkEntries.filter((e) => e.isDirty).length;

  return {
    checkEntries,
    dirtyCount,
    isLoading,
    isError,
    onQuantityChange: handleQuantityChange,
    onSaveEntry: handleSaveEntry,
    onRefetch: () => void refetch(),
  };
};
