import { Building2, Phone, Mail, Calendar, CreditCard, MapPin, UserCircle, Edit, Fingerprint, Home } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { StaffDetailFull } from '../../data/staffDetailMock';

interface StaffInfoCardProps {
  staff: StaffDetailFull;
  onEdit: () => void;
}

/**
 * Card hiển thị thông tin chi tiết nhân viên
 * Đã cập nhật theo Module 4 Spec (fullName, positionName)
 */
export const StaffInfoCard = ({ staff, onEdit }: StaffInfoCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {staff.fullName}
            </h2>
            <p className="text-gray-500 mt-1">{staff.positionName}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`badge ${staff.status === 'active' ? 'badge-completed' : 'badge-warning'}`}>
                {staff.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
              </span>
              <span className="badge badge-secondary">{staff.shiftType === 'full-time' ? 'Toàn thời gian' : 'Bán thời gian'}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <InfoItem icon={Phone} label="Số điện thoại" value={staff.phone} />
        <InfoItem icon={Mail} label="Email" value={staff.email} />
        <InfoItem icon={Fingerprint} label="CMND/CCCD" value={staff.identityId} />
        <InfoItem icon={Calendar} label="Ngày sinh" value={new Date(staff.dateOfBirth).toLocaleDateString('vi-VN')} />
        <InfoItem icon={Building2} label="Chi nhánh" value={staff.branchName} />
        <InfoItem icon={Calendar} label="Ngày vào làm" value={new Date(staff.hireDate).toLocaleDateString('vi-VN')} />
        <InfoItem icon={CreditCard} label="Lương" value={`${staff.salary.toLocaleString('vi-VN')}đ`} />
        <InfoItem icon={MapPin} label="Địa chỉ" value={`${staff.address}, ${staff.city}`} />
        <InfoItem icon={Home} label="Quản lý trực tiếp" value={staff.manager?.fullName || 'Chưa phân công'} />
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value || '---'}</p>
    </div>
  </div>
);