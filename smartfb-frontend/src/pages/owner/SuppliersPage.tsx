import { useState } from 'react';
import { Truck, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { SupplierTable } from '@modules/supplier/components/SupplierTable';
import { SupplierFormDialog } from '@modules/supplier/components/SupplierFormDialog';
import { useSuppliers } from '@modules/supplier/hooks/useSuppliers';
import { Supplier } from '@modules/supplier/types/supplier.types';
import toast from 'react-hot-toast';

const StatCard = ({ icon, iconBg, label, value, colorClass }: { icon: React.ReactNode; iconBg: string; label: string; value: string, colorClass?: string }) => (
  <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      <span>{label}</span>
    </div>
    <div className={`text-2xl font-bold ${colorClass || 'text-gray-900'}`}>{value}</div>
  </div>
);

export default function SuppliersPage() {
  const { 
    suppliers, 
    isLoading, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    isCreating,
    isUpdating
  } = useSuppliers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);

  // Thống kê
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const inactiveSuppliers = totalSuppliers - activeSuppliers;

  const handleOpenAddForm = () => {
    setEditingSupplier(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`)) {
      try {
        await deleteSupplier(supplier.id);
      } catch (error) {
        // Lỗi đã được xử lý trong hook
      }
    }
  };

  const handleSubmitForm = async (payload: any) => {
    try {
      if (editingSupplier) {
        await updateSupplier({ id: editingSupplier.id, payload });
      } else {
        await createSupplier(payload);
      }
      setIsFormOpen(false);
    } catch (error) {
      // Lỗi đã được xử lý trong hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhà cung cấp</h1>
          <p className="text-sm text-gray-500">Danh sách các đối tác cung ứng nguyên liệu toàn chuỗi</p>
        </div>
        <Button 
          onClick={handleOpenAddForm}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Truck className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Tổng nhà cung cấp"
          value={totalSuppliers.toString().padStart(2, '0')}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          label="Đang hợp tác"
          value={activeSuppliers.toString().padStart(2, '0')}
          colorClass="text-green-600"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-50"
          label="Tạm ngừng"
          value={inactiveSuppliers.toString().padStart(2, '0')}
          colorClass="text-orange-600"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <SupplierTable 
          suppliers={suppliers} 
          onEdit={handleOpenEditForm}
          onDelete={handleDelete}
        />
      </div>

      {/* Form Dialog */}
      <SupplierFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        supplier={editingSupplier}
        onSubmit={handleSubmitForm}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
