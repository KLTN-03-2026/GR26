import { Pencil, Phone, Mail } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import type { BranchDetailFull } from "@modules/branch/data/branchDetailMock";

interface BranchInfoCardProps {
  branch: BranchDetailFull;
  onEdit?: () => void;
}

const formatTime = (time: string) => time;

/**
 * Card hiển thị thông tin chi tiết chi nhánh
 * Bao gồm: cover image, thông tin cơ bản, manager info
 */
export const BranchInfoCard = ({ branch, onEdit }: BranchInfoCardProps) => {
  const {
    code,
    name,
    taxCode,
    address,
    city,
    phone,
    openTime,
    closeTime,
    coverImage,
    manager,
    isOpened,
  } = branch;

  const fullAddress = `${address}, ${city}`;
  const openingHours = `${formatTime(openTime)} - ${formatTime(closeTime)}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Header với nút chỉnh sửa */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Thông tin chi nhánh
        </h2>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 p-4 gap-2">
        {/* Cover Image */}
        {coverImage && (
          <div className="col-span-2">
            <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
              <img
                src={coverImage}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Thông tin chi nhánh */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Mã chi nhánh */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Mã chi nhánh
              </label>
              <p className="mt-1 font-semibold text-gray-900">{code}</p>
            </div>

            {/* Tên chi nhánh */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Tên chi nhánh
              </label>
              <p className="mt-1 font-semibold text-gray-900">{name}</p>
            </div>

            {/* Mã số thuế */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Mã số thuế
              </label>
              <p className="mt-1 font-semibold text-gray-900">{taxCode}</p>
            </div>

            {/* Giờ hoạt động */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Giờ hoạt động
              </label>
              <p className="mt-1 font-semibold text-gray-900">{openingHours}</p>
            </div>

            {/* Trạng thái cửa hàng */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Trạng thái cửa hàng
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    isOpened
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOpened ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {isOpened ? "Mở cửa" : "Đóng cửa"}
                </span>
              </div>
            </div>
            {/* Điện thoại */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Điện thoại
              </label>
              <p className="mt-1 font-semibold text-gray-900">{phone}</p>
            </div>
            {/* Địa chỉ */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Địa chỉ
              </label>
              <p className="mt-1 font-semibold text-gray-900">{fullAddress}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="p-4 border-t border-gray-100">
        <div className="space-y-4">
          {/* Quản lý chi nhánh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                {manager.avatar ? (
                  <img
                    src={manager.avatar}
                    alt={manager.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-sm font-medium">
                      {manager.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Quản lý chi nhánh</p>
                <p className="font-semibold text-gray-900">{manager.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
