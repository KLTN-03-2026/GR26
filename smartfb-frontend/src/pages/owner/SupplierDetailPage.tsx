import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { ROUTES } from '@shared/constants/routes';
import { useSupplierDetail } from '@modules/supplier/hooks/useSupplierDetail';
import { useSuppliers } from '@modules/supplier/hooks/useSuppliers';
import { ProfileTab } from '@modules/supplier/components/SupplierDetail/ProfileTab';
import { PriceListTab } from '@modules/supplier/components/SupplierDetail/PriceListTab';
import { DebtTab } from '@modules/supplier/components/SupplierDetail/DebtTab';
import { PurchaseOrdersTab } from '@modules/supplier/components/SupplierDetail/PurchaseOrdersTab';
import { CreatePurchaseOrderDialog } from '@modules/supplier/components/SupplierDetail/CreatePurchaseOrderDialog';
import { SupplierFormDialog } from '@modules/supplier/components/SupplierFormDialog';
import type { CreateSupplierPayload } from '@modules/supplier/types/supplier.types';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreatePurchaseOrderOpen, setIsCreatePurchaseOrderOpen] = useState(false);

  const { supplier, orders, priceList, debt, isLoading } = useSupplierDetail(id);
  const { updateSupplier, deleteSupplier, isUpdating } = useSuppliers();

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (supplier && window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`)) {
      await deleteSupplier(supplier.id);
      navigate(ROUTES.OWNER.SUPPLIERS);
    }
  };

  const handleSubmitEdit = async (payload: CreateSupplierPayload) => {
    if (id && supplier) {
      await updateSupplier({ id, payload, currentActive: supplier.isActive });
      setIsFormOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Không tìm thấy nhà cung cấp</p>
        <Button onClick={() => navigate(ROUTES.OWNER.SUPPLIERS)}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => navigate(ROUTES.OWNER.SUPPLIERS)}
            className="hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Nhà cung cấp
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{supplier.name}</span>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            size="sm"
            onClick={() => setIsCreatePurchaseOrderOpen(true)}
            className="flex-1 md:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mua
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1 md:flex-none">
            <Edit3 className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1 md:flex-none">
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Mã: <b className="text-gray-700">{supplier.code}</b></span>
            <span>MST: <b className="text-gray-700">{supplier.taxCode}</b></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Tổng đơn mua</p>
            <p className="text-lg font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="h-10 w-[1px] bg-gray-100"></div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Trạng thái</p>
            <span className={`badge ${supplier.isActive ? 'badge-completed' : 'badge-warning'}`}>
              {supplier.isActive ? 'Đang hợp tác' : 'Ngừng giao dịch'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl w-full md:w-auto inline-flex overflow-x-auto">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Hồ sơ nhà cung cấp
          </TabsTrigger>
          <TabsTrigger value="pricelist" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Bảng giá nguyên liệu
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Đơn mua hàng
          </TabsTrigger>
          <TabsTrigger value="debt" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Công nợ & Thanh toán
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
          <ProfileTab supplier={supplier} />
        </TabsContent>
        <TabsContent value="pricelist" className="mt-0 focus-visible:outline-none">
          <PriceListTab ingredients={priceList} />
        </TabsContent>
        <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
          <PurchaseOrdersTab orders={orders} />
        </TabsContent>
        <TabsContent value="debt" className="mt-0 focus-visible:outline-none">
          <DebtTab debt={debt} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <SupplierFormDialog
        key={supplier.id}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        supplier={supplier}
        onSubmit={handleSubmitEdit}
        isLoading={isUpdating}
      />
      <CreatePurchaseOrderDialog
        open={isCreatePurchaseOrderOpen}
        onOpenChange={setIsCreatePurchaseOrderOpen}
        supplierId={supplier.id}
        supplierName={supplier.name}
      />
    </div>
  );
}
