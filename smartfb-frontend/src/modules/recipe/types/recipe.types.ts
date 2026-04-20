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
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026
 * Thêm baseOutputQuantity và baseOutputUnit để UI hiển thị sản lượng chuẩn
 * của recipe SUB_ASSEMBLY và cho phép user kiểm tra / sửa lại nếu sai.
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
  /** Sản lượng đầu ra chuẩn của công thức (chỉ có với SUB_ASSEMBLY recipe). Null với SELLABLE. */
  baseOutputQuantity: number | null;
  /** Đơn vị sản lượng đầu ra chuẩn (ví dụ: ml, g). Null với SELLABLE. */
  baseOutputUnit: string | null;
}

/**
 * Payload tạo mới một dòng công thức.
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026
 * Thêm baseOutputQuantity và baseOutputUnit cho recipe SUB_ASSEMBLY.
 * Với recipe SELLABLE: để undefined/null.
 */
export interface CreateRecipePayload {
  targetItemId: string;
  ingredientItemId: string;
  quantity: number;
  unit: string;
  /** Sản lượng đầu ra chuẩn mỗi mẻ (chỉ bắt buộc với SUB_ASSEMBLY recipe). */
  baseOutputQuantity?: number;
  /** Đơn vị sản lượng chuẩn (ví dụ: ml, g). */
  baseOutputUnit?: string;
}

/**
 * Payload cập nhật định lượng công thức.
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026
 * Thêm baseOutputQuantity và baseOutputUnit để user có thể sửa lại
 * các recipe SUB_ASSEMBLY đã lưu sai trước đây.
 */
export interface UpdateRecipePayload {
  quantity: number;
  unit: string;
  /** Sản lượng đầu ra chuẩn mới. Undefined = giữ nguyên giá trị cũ ở backend. */
  baseOutputQuantity?: number;
  /** Đơn vị sản lượng chuẩn mới. Undefined = giữ nguyên. */
  baseOutputUnit?: string;
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
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026
 * Thêm baseOutputQuantity và baseOutputUnit để form SUB_ASSEMBLY recipe
 * cho phép user nhập sản lượng chuẩn của công thức.
 * Với form SELLABLE recipe: 2 field này để trống / ẩn.
 */
export interface RecipeLineFormValues {
  ingredientItemId: string;
  quantity: string;
  unit: string;
  /** Sản lượng đầu ra chuẩn (chuỗi vì lấy từ input text). Chỉ dùng với SUB_ASSEMBLY target. */
  baseOutputQuantity: string;
  /** Đơn vị sản lượng chuẩn. Chỉ dùng với SUB_ASSEMBLY target. */
  baseOutputUnit: string;
}
