import { X } from 'lucide-react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

/**
 * Tag hiển thị filter đã chọn, có nút xóa
 */
export const FilterTag = ({ label, onRemove }: FilterTagProps) => {
  return (
    <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-orange-100 rounded-full p-0.5 transition-colors"
        aria-label="Xóa filter"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
