import type { Supplier } from '../../types/supplier.types';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Mail, Phone, MapPin, User, Building2, CreditCard } from 'lucide-react';

interface ProfileTabProps {
  supplier: Supplier;
}

export const ProfileTab = ({ supplier }: ProfileTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Mã NCC</span>
            <span className="font-semibold">{supplier.code}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Mã số thuế</span>
            <span className="font-semibold">{supplier.taxCode}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Trạng thái</span>
            <Badge className={supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
              {supplier.isActive ? 'Đang hợp tác' : 'Ngừng giao dịch'}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Người đại diện</span>
            <span className="font-semibold">{supplier.contactPerson}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Phone className="w-5 h-5 text-orange-500" />
            Liên hệ & Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 py-2">
            <Phone className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <p className="text-xs text-gray-500 italic">Số điện thoại</p>
              <p className="font-medium">{supplier.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-2">
            <Mail className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <p className="text-xs text-gray-500 italic">Email</p>
              <p className="font-medium">{supplier.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
            <div>
              <p className="text-xs text-gray-500 italic">Địa chỉ</p>
              <p className="font-medium">{supplier.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            Thông tin thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 italic">Tên ngân hàng</p>
              <p className="font-bold text-gray-800">{supplier.bankName || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 italic">Số tài khoản</p>
              <p className="font-bold text-gray-800 tracking-wider">
                {supplier.bankAccount || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
