import { useMemo, useState } from 'react';
import { useInventoryBalances } from '@modules/inventory/hooks/useInventoryBalances';
import { useInventoryIngredientOptions } from '@modules/inventory/hooks/useInventoryIngredientOptions';
import type { InventoryBalance, InventoryIngredientCatalogRow } from '@modules/inventory/types/inventory.types';

const INVENTORY_INGREDIENT_CATALOG_PAGE_SIZE = 12;

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const buildIngredientStockMap = (balances: InventoryBalance[]): Map<string, Pick<InventoryIngredientCatalogRow, 'hasStock' | 'stockBranchCount' | 'totalQuantity'>> => {
  return balances.reduce((result, balance) => {
    const currentValue = result.get(balance.itemId) ?? {
      hasStock: false,
      stockBranchCount: 0,
      totalQuantity: 0,
    };

    result.set(balance.itemId, {
      hasStock: true,
      stockBranchCount: currentValue.stockBranchCount + 1,
      totalQuantity: currentValue.totalQuantity + balance.quantity,
    });

    return result;
  }, new Map<string, Pick<InventoryIngredientCatalogRow, 'hasStock' | 'stockBranchCount' | 'totalQuantity'>>());
};

/**
 * Hook chuẩn hóa dữ liệu cho tab danh mục nguyên liệu.
 * Mục tiêu là hiển thị được cả nguyên liệu đã tạo nhưng chưa phát sinh tồn kho.
 */
export const useInventoryIngredientCatalogView = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: ingredientOptions = [],
    isLoading: isIngredientsLoading,
    isError: isIngredientsError,
    refetch,
  } = useInventoryIngredientOptions();
  const { data: inventoryBalancesResult, isLoading: isBalancesLoading } = useInventoryBalances();

  const ingredientBalances = useMemo(
    () =>
      (inventoryBalancesResult?.data ?? []).filter(
        (balance) => balance.itemType !== 'SUB_ASSEMBLY',
      ),
    [inventoryBalancesResult?.data],
  );

  const stockMap = useMemo(
    () => buildIngredientStockMap(ingredientBalances),
    [ingredientBalances],
  );

  const catalogRows = useMemo<InventoryIngredientCatalogRow[]>(
    () =>
      ingredientOptions
        .map((item) => {
          const stockInfo = stockMap.get(item.itemId);

          return {
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            hasStock: stockInfo?.hasStock ?? false,
            stockBranchCount: stockInfo?.stockBranchCount ?? 0,
            totalQuantity: stockInfo?.totalQuantity ?? 0,
          };
        })
        .sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi')),
    [ingredientOptions, stockMap],
  );

  const filteredRows = useMemo(() => {
    const keyword = normalizeSearch(search);

    return catalogRows.filter((item) => {
      if (keyword.length === 0) {
        return true;
      }

      return (
        item.itemName.toLowerCase().includes(keyword) ||
        item.itemId.toLowerCase().includes(keyword) ||
        (item.unit?.toLowerCase().includes(keyword) ?? false)
      );
    });
  }, [catalogRows, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / INVENTORY_INGREDIENT_CATALOG_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * INVENTORY_INGREDIENT_CATALOG_PAGE_SIZE;

    return filteredRows.slice(
      startIndex,
      startIndex + INVENTORY_INGREDIENT_CATALOG_PAGE_SIZE,
    );
  }, [filteredRows, safeCurrentPage]);

  const ingredientsWithStockCount = useMemo(
    () => catalogRows.filter((item) => item.hasStock).length,
    [catalogRows],
  );

  const ingredientsWithoutStockCount = useMemo(
    () => catalogRows.filter((item) => !item.hasStock).length,
    [catalogRows],
  );

  return {
    currentPage: safeCurrentPage,
    ingredientsWithStockCount,
    ingredientsWithoutStockCount,
    isError: isIngredientsError,
    isLoading: isIngredientsLoading || isBalancesLoading,
    onPageChange: setCurrentPage,
    onRefetch: refetch,
    onSearchChange: (value: string) => {
      setSearch(value);
      setCurrentPage(1);
    },
    pageSize: INVENTORY_INGREDIENT_CATALOG_PAGE_SIZE,
    paginatedRows,
    search,
    totalCatalogItems: catalogRows.length,
    totalFilteredItems: filteredRows.length,
    totalPages,
  };
};
