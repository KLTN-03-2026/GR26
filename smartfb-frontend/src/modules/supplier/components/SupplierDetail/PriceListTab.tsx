import { SupplierIngredient } from '../../types/supplier.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Badge } from '@shared/components/common/Badge';
import { Star } from 'lucide-react';

interface PriceListTabProps {
  ingredients: SupplierIngredient[];
}

export const PriceListTab = ({ ingredients }: PriceListTabProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Nguyên liệu</TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">Đơn giá (VNĐ)</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Tối thiểu (MoQ)</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Ưu tiên</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                Chưa có dữ liệu bảng giá cho nhà cung cấp này
              </TableCell>
            </TableRow>
          ) : (
            ingredients.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-gray-900">{item.ingredientName}</TableCell>
                <TableCell className="text-right font-semibold text-orange-600">
                  {item.price.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {item.minimumOrderQty} đơn vị
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {item.isPreferred && (
                    <div className="flex justify-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
