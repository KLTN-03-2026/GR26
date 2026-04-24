import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2, Search, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import { Supplier } from '../../types/supplier.types';
import { useSuppliers } from '../../hooks/useSuppliers';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  isReadOnly?: boolean;
}

export const SupplierTable = ({ suppliers, onEdit, onDelete, isReadOnly = false }: SupplierTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.taxCode.includes(searchTerm) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, MST hoặc SĐT..."
            className="input pl-10 h-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Tên nhà cung cấp</TableHead>
              <TableHead className="font-semibold text-gray-700">Mã / MST</TableHead>
              <TableHead className="font-semibold text-gray-700">Số điện thoại</TableHead>
              <TableHead className="font-semibold text-gray-700">Người liên hệ</TableHead>
              <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  Không tìm thấy nhà cung cấp phù hợp
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`${ROUTES.OWNER.SUPPLIERS}/${supplier.id}`)}
                >
                  <TableCell className="font-medium text-gray-900">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">{supplier.code}</div>
                    <div className="text-xs text-gray-500">MST: {supplier.taxCode}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{supplier.phone}</TableCell>
                  <TableCell className="text-sm text-gray-600">{supplier.contactPerson}</TableCell>
                  <TableCell>
                    <span className={`badge ${supplier.isActive ? 'badge-completed' : 'badge-warning'}`}>
                      {supplier.isActive ? 'Đang hợp tác' : 'Ngừng giao dịch'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn-ghost p-2 rounded-lg hover:bg-gray-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`${ROUTES.OWNER.SUPPLIERS}/${supplier.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        {!isReadOnly && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(supplier)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete(supplier)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
