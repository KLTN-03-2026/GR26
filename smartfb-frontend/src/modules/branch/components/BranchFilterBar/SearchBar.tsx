import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Thanh tìm kiếm với icon search
 */
export const SearchBar = ({ value, onChange, placeholder = 'Tìm kiếm...' }: SearchBarProps) => {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10 w-full"
      />
    </div>
  );
};
