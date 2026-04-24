import { useState, useEffect } from 'react';
import { Shield, Save, Check, X, AlertCircle } from 'lucide-react';
import { permissionService, type ModulePermission } from '@modules/staff/services/permissionService';
import { ROLES } from '@shared/constants/roles';
import { useToast } from '@shared/hooks/useToast';

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.STAFF);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const response = await permissionService.getRolePermissions(selectedRole);
        setPermissions(response.data || []);
      } catch {
        error('Thất bại', 'Không thể tải bảng quyền hạn');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, [selectedRole]);

  const togglePermission = (moduleKey: string, field: keyof Omit<ModulePermission, 'module_key' | 'module_name'>) => {
    setPermissions(prev => prev.map(p => {
      if (p.module_key === moduleKey) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await permissionService.updateRolePermissions(selectedRole, permissions);
      success('Thành công', 'Đã cập nhật ma trận phân quyền');
    } catch {
      error('Thất bại', 'Không thể lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma trận Phân quyền (RBAC)</h1>
          <p className="text-gray-500">Thiết lập chi tiết quyền hạn cho từng vai trò người dùng</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isSaving ? <div className="spinner spinner-xs" /> : <Save className="w-4 h-4" />}
          Lưu thay đổi
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {[ROLES.STAFF, ROLES.OWNER, ROLES.ADMIN].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedRole === role 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {role.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Module / Chức năng</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Xem (View)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Thêm (Create)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Sửa (Update)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Xóa (Delete)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="spinner" />
                    Đang tải dữ liệu phân quyền...
                  </div>
                </td>
              </tr>
            ) : permissions.map((item) => (
              <tr key={item.module_key} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{item.module_name}</span>
                  <code className="ml-2 text-xs text-gray-400">[{item.module_key}]</code>
                </td>
                {['can_view', 'can_create', 'can_update', 'can_delete'].map((field) => (
                  <td key={field} className="px-6 py-4 text-center">
                    <button
                      onClick={() => togglePermission(item.module_key, field as any)}
                      className={`w-10 h-6 rounded-full transition-all relative ${
                        item[field as keyof ModulePermission] ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        item[field as keyof ModulePermission] ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && permissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    Chưa có dữ liệu module cho vai trò này.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
