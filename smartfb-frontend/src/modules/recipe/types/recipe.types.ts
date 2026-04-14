/**
 * Tóm tắt món bán dùng để chọn công thức cần quản lý.
 */
export interface RecipeMenuItem {
  id: string;
  categoryId: string | null;
  name: string;
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
