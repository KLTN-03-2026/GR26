import { Info } from 'lucide-react';
import { SupplierTable } from '@modules/supplier/components/SupplierTable';
import { useSuppliers } from '@modules/supplier/hooks/useSuppliers';

export default function SupplierListPage() {
  const { suppliers, isLoading } = useSuppliers();

  // Thống kê đơn giản cho nhân viên
  const activeSuppliers = suppliers.filter(s => s.isActive).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách nhà cung cấp</h1>
          <p className="text-sm text-gray-500">Tra cứu thông tin đối tác và bảng giá nguyên liệu</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 text-blue-700 text-sm">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>Nhân viên chỉ có quyền xem thông tin tra cứu, không có quyền chỉnh sửa hồ sơ đối tác.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Đang hợp tác</p>
            <p className="text-2xl font-bold text-slate-900">{activeSuppliers}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Hỗ trợ tra cứu</p>
            <p className="text-sm font-medium text-slate-700">Giá, SĐT, Người liên hệ</p>
          </div>
        </div>

        <SupplierTable 
          suppliers={suppliers} 
          onEdit={() => {}} // Disabled for staff
          onDelete={() => {}} // Disabled for staff
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
