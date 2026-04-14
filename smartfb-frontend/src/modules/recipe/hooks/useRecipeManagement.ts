import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { recipeService } from '@modules/recipe/services/recipeService';
import type {
  CreateRecipePayload,
  RecipeIngredientOption,
  RecipeLine,
  UpdateRecipePayload,
} from '@modules/recipe/types/recipe.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useDebounce } from '@shared/hooks/useDebounce';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

const RECIPE_MENU_PAGE_SIZE = 10;
const ALL_CATEGORY_VALUE = 'all';

/**
 * Hook gom toàn bộ state và thao tác cho màn quản lý công thức.
 * Giữ page ở mức render, còn query/mutation và derived state nằm trong module.
 */
export const useRecipeManagement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_VALUE);
  const [selectedItemIdState, setSelectedItemId] = useState<string>('');
  const debouncedSearchKeyword = useDebounce(searchKeyword.trim(), 300);

  const menuItemsQuery = useInfiniteQuery({
    queryKey: queryKeys.recipes.menuItems({
      keyword: debouncedSearchKeyword || 'all',
      size: RECIPE_MENU_PAGE_SIZE,
    }),
    queryFn: ({ pageParam }) =>
      recipeService.getMenuItems({
        keyword: debouncedSearchKeyword || undefined,
        page: pageParam,
        size: RECIPE_MENU_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.recipes.categories,
    queryFn: () => recipeService.getMenuCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const ingredientsQuery = useQuery({
    queryKey: queryKeys.recipes.ingredients,
    queryFn: () => recipeService.getIngredientOptions(),
    staleTime: 60 * 1000,
  });

  const loadedMenuItems = useMemo(() => {
    return (menuItemsQuery.data?.pages ?? []).flatMap((page) => page.items);
  }, [menuItemsQuery.data]);

  const totalMenuItems = useMemo(() => {
    return menuItemsQuery.data?.pages[0]?.totalElements ?? 0;
  }, [menuItemsQuery.data]);

  /**
   * Lọc theo danh mục ở FE do backend hiện chưa hỗ trợ category param cho /menu/items.
   */
  const menuItems = useMemo(() => {
    if (selectedCategoryId === ALL_CATEGORY_VALUE) {
      return loadedMenuItems;
    }

    return loadedMenuItems.filter((item) => item.categoryId === selectedCategoryId);
  }, [loadedMenuItems, selectedCategoryId]);

  const categoryOptions = useMemo(() => {
    return [
      {
        id: ALL_CATEGORY_VALUE,
        name: 'Tất cả danh mục',
      },
      ...(categoriesQuery.data ?? []),
    ];
  }, [categoriesQuery.data]);

  /**
   * Nếu item đang chọn không còn nằm trong danh sách đã lọc, tự fallback sang item đầu tiên.
   * Dùng state dẫn xuất thay vì setState trong effect để hợp rule React Compiler của repo.
   */
  const selectedItemId = useMemo(() => {
    const hasSelectedItem = menuItems.some((item) => item.id === selectedItemIdState);

    if (hasSelectedItem) {
      return selectedItemIdState;
    }

    return menuItems[0]?.id ?? '';
  }, [menuItems, selectedItemIdState]);

  const recipeDetailQuery = useQuery({
    queryKey: queryKeys.recipes.detail(selectedItemId),
    queryFn: () => recipeService.getRecipeByItem(selectedItemId),
    enabled: Boolean(selectedItemId),
    staleTime: 30 * 1000,
  });

  /**
   * Map nguyên liệu theo itemId để enrich tên và tồn kho tham chiếu cho từng dòng công thức.
   * Nếu nguyên liệu chưa nhập kho thì `availableQuantity` sẽ là `null`, nhưng vẫn được phép tạo recipe.
   */
  const ingredientMap = useMemo(() => {
    return new Map((ingredientsQuery.data ?? []).map((ingredient) => [ingredient.itemId, ingredient]));
  }, [ingredientsQuery.data]);

  /**
   * Recipe response của backend chỉ có ingredientItemId nên FE phải ghép thêm tên hiển thị.
   */
  const recipeLines = useMemo<RecipeLine[]>(() => {
    return (recipeDetailQuery.data ?? []).map((line) => {
      const ingredient = ingredientMap.get(line.ingredientItemId);

      return {
        ...line,
        ingredientName: ingredient?.itemName ?? line.ingredientName,
        unit: line.unit || ingredient?.unit || '',
        availableQuantity: ingredient?.quantity ?? null,
      };
    });
  }, [ingredientMap, recipeDetailQuery.data]);

  const selectedItem = useMemo(() => {
    return menuItems.find((item) => item.id === selectedItemId) ?? null;
  }, [menuItems, selectedItemId]);

  const createRecipeMutation = useMutation({
    mutationFn: (payload: CreateRecipePayload) => recipeService.createRecipe(payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(variables.targetItemId) });
      success('Thêm công thức thành công', 'Đã thêm nguyên liệu vào công thức món bán');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể thêm công thức', errorMessage);
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: (variables: { recipeId: string; payload: UpdateRecipePayload }) =>
      recipeService.updateRecipe(variables.recipeId, variables.payload),
    onSuccess: () => {
      if (selectedItemId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(selectedItemId) });
      }

      success('Cập nhật công thức thành công', 'Định lượng nguyên liệu đã được cập nhật');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật công thức', errorMessage);
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (recipeId: string) => recipeService.deleteRecipe(recipeId),
    onSuccess: () => {
      if (selectedItemId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(selectedItemId) });
      }

      success('Xóa công thức thành công', 'Nguyên liệu đã được gỡ khỏi công thức');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa công thức', errorMessage);
    },
  });

  /**
   * Trả về danh sách nguyên liệu hợp lệ cho dialog.
   * Mặc định sẽ loại bỏ các nguyên liệu đã có để tránh tạo bản ghi trùng.
   */
  const getSelectableIngredients = useCallback(
    (currentIngredientItemId?: string): RecipeIngredientOption[] => {
      const usedIngredientIds = new Set(
        recipeLines
          .filter((line) => line.ingredientItemId !== currentIngredientItemId)
          .map((line) => line.ingredientItemId)
      );

      return (ingredientsQuery.data ?? []).filter((ingredient) => !usedIngredientIds.has(ingredient.itemId));
    },
    [ingredientsQuery.data, recipeLines]
  );

  return {
    categoryOptions,
    debouncedSearchKeyword,
    ingredients: ingredientsQuery.data ?? [],
    isCategoriesError: categoriesQuery.isError,
    isCategoriesLoading: categoriesQuery.isLoading,
    isCreatingRecipe: createRecipeMutation.isPending,
    isDeletingRecipe: deleteRecipeMutation.isPending,
    isIngredientsError: ingredientsQuery.isError,
    isIngredientsLoading: ingredientsQuery.isLoading,
    isIngredientsRefreshing: ingredientsQuery.isFetching,
    isLoadingMoreMenuItems: menuItemsQuery.isFetchingNextPage,
    isMenuItemsError: menuItemsQuery.isError,
    isMenuItemsLoading: menuItemsQuery.isLoading,
    isMenuItemsRefreshing: menuItemsQuery.isRefetching,
    isRecipeError: recipeDetailQuery.isError,
    isRecipeLoading: recipeDetailQuery.isLoading,
    isRecipeRefreshing: recipeDetailQuery.isFetching,
    isUpdatingRecipe: updateRecipeMutation.isPending,
    loadedMenuItemCount: loadedMenuItems.length,
    hasMoreMenuItems: Boolean(menuItemsQuery.hasNextPage),
    menuItems,
    recipeLines,
    searchKeyword,
    selectedCategoryId,
    selectedItem,
    selectedItemId,
    totalMenuItems,
    setSearchKeyword,
    setSelectedCategoryId,
    setSelectedItemId,
    onCreateRecipe: createRecipeMutation.mutateAsync,
    onDeleteRecipe: deleteRecipeMutation.mutateAsync,
    onLoadMoreMenuItems: () => menuItemsQuery.fetchNextPage(),
    onRefetchIngredients: ingredientsQuery.refetch,
    onRefetchMenuItems: menuItemsQuery.refetch,
    onRefetchRecipe: recipeDetailQuery.refetch,
    onUpdateRecipe: (recipeId: string, payload: UpdateRecipePayload) =>
      updateRecipeMutation.mutateAsync({ recipeId, payload }),
    getSelectableIngredients,
  };
};
