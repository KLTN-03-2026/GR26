/**
 * Loại item đích mà màn công thức cho phép quản lý.
 */
export type RecipeTargetItemType = 'SELLABLE' | 'SUB_ASSEMBLY';

/**
 * Loại thành phần có thể tham gia vào công thức theo contract backend.
 */
export type RecipeComponentItemType = 'INGREDIENT' | 'SUB_ASSEMBLY';

/**
 * Loại thành phần sau khi FE enrich từ catalog.
 */
export type RecipeResolvedComponentType = RecipeComponentItemType | 'UNKNOWN';

/**
 * Nhãn hiển thị cho từng loại item đích ở màn công thức.
 */
export const RECIPE_TARGET_TYPE_LABELS: Record<RecipeTargetItemType, string> = {
  SELLABLE: 'Món bán',
  SUB_ASSEMBLY: 'Bán thành phẩm',
};

/**
 * Nhãn hiển thị cho từng loại thành phần trong công thức.
 */
export const RECIPE_COMPONENT_TYPE_LABELS: Record<RecipeResolvedComponentType, string> = {
  INGREDIENT: 'Nguyên liệu',
  SUB_ASSEMBLY: 'Bán thành phẩm',
  UNKNOWN: 'Chưa xác định',
};

/**
 * Tóm tắt món bán dùng để chọn công thức cần quản lý.
 */
export interface RecipeMenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  itemType: RecipeTargetItemType;
  basePrice: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Danh mục món dùng cho bộ lọc ở màn công thức.
 */
export interface RecipeMenuCategory {
  id: string;
  name: string;
}

/**
 * Kết quả danh sách món bán theo trang nhỏ để tối ưu lúc có nhiều món.
 */
export interface RecipeMenuListResult {
  items: RecipeMenuItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * Option nguyên liệu dùng cho dialog công thức.
 * FE ưu tiên đọc từ catalog `INGREDIENT`, còn số lượng tồn chỉ là dữ liệu tham chiếu nếu có.
 */
export interface RecipeIngredientOption {
  itemId: string;
  itemName: string;
  itemType: RecipeComponentItemType;
  itemTypeLabel: string;
  unit: string;
  branchIds: string[];
  quantity: number | null;
}

/**
 * Dòng công thức đã được enrich để UI hiển thị được tên nguyên liệu và tồn kho.
 */
export interface RecipeLine {
  id: string;
  targetItemId: string;
  ingredientItemId: string;
  ingredientName: string;
  ingredientType: RecipeResolvedComponentType;
  ingredientTypeLabel: string;
  quantity: number;
  unit: string;
  availableQuantity: number | null;
}

/**
 * Payload tạo mới một dòng công thức.
 */
export interface CreateRecipePayload {
  targetItemId: string;
  ingredientItemId: string;
  quantity: number;
  unit: string;
}

/**
 * Payload cập nhật định lượng công thức.
 */
export interface UpdateRecipePayload {
  quantity: number;
  unit: string;
}

/**
 * Bộ lọc danh sách món bán ở màn công thức.
 */
export interface RecipeMenuListParams {
  type?: RecipeTargetItemType;
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * Giá trị form thêm hoặc sửa dòng công thức.
 */
export interface RecipeLineFormValues {
  ingredientItemId: string;
  quantity: string;
  unit: string;
}
