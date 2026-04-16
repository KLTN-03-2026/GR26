/**
 * @author Đào Thu Thiên
 * @description Dropdown filter với icon mũi tên
 * @created 2026-04-16
 */

import { ChevronDown } from 'lucide-react';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    defaultLabel?: string;
}

export const FilterDropdown = ({
    value,
    onChange,
    options,
    defaultLabel = 'Chọn...',
}: FilterDropdownProps) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input px-3 py-2 pr-8 cursor-pointer appearance-none"
            >
                <option value="all">{defaultLabel}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    );
};