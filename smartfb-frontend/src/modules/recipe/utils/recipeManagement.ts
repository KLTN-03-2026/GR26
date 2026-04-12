import type { RecipeLine } from '@modules/recipe/types/recipe.types';

export interface RecipeLineInsight extends RecipeLine {
  coverageCount: number | null;
  displayUnit: string;
  stockStatus: 'enough' | 'low' | 'unknown';
  stockStatusLabel: string;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

const DECIMAL_FORMATTER = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 1,
});

/**
 * Format số lượng nguyên liệu hoặc giá trị tồn kho theo chuẩn tiếng Việt để UI nhất quán.
 */
export const formatRecipeNumber = (value: number) => {
  return NUMBER_FORMATTER.format(value);
};

/**
 * Format mức đáp ứng công thức với tối đa 1 chữ số thập phân để dễ đọc hơn trên bảng.
 */
export const formatRecipeCoverageCount = (value: number) => {
  return DECIMAL_FORMATTER.format(value);
};

/**
 * Enrich dữ liệu công thức để UI đọc nhanh hơn mà không đổi contract API.
 */
export const buildRecipeInsights = (
  recipeLines: RecipeLine[]
): RecipeLineInsight[] => {
  return recipeLines.map((line) => {
    const displayUnit = line.unit || 'đơn vị';
    const coverageCount =
      line.availableQuantity !== null && line.quantity > 0
        ? line.availableQuantity / line.quantity
        : null;
    const stockStatus =
      line.availableQuantity === null
        ? 'unknown'
        : line.availableQuantity >= line.quantity
          ? 'enough'
          : 'low';

    return {
      ...line,
      coverageCount,
      displayUnit,
      stockStatus,
      stockStatusLabel:
        stockStatus === 'enough'
          ? 'Đủ tồn'
          : stockStatus === 'low'
            ? 'Thiếu tồn'
            : 'Chưa có tồn',
    };
  });
};

/**
 * Tạo chuỗi mô tả công thức theo dạng tóm tắt để phần header hiển thị nhanh cho người dùng.
 */
export const buildRecipeFormulaSummary = (
  recipeInsights: RecipeLineInsight[]
) => {
  if (recipeInsights.length === 0) {
    return 'Món này chưa có công thức.';
  }

  return recipeInsights
    .map(
      (line) =>
        `${formatRecipeNumber(line.quantity)} ${line.displayUnit} ${line.ingredientName}`
    )
    .join(' + ');
};
