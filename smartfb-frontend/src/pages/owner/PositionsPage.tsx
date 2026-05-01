import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { positionService } from '@modules/staff/services/positionService';
import { useToast } from '@shared/hooks/useToast';
import type { Position, CreatePositionPayload } from '@modules/staff/types/position.types';

export default function PositionsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newPosition, setNewPosition] = useState<CreatePositionPayload>({
    name: '',
    description: '',
    base_salary: 0,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['staff', 'positions'],
    queryFn: () => positionService.getList(),
  });

  const positions = response?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreatePositionPayload) => positionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'positions'] });
      setIsAdding(false);
      setNewPosition({ name: '', description: '', base_salary: 0 });
      success('Thành công', 'Đã thêm chức vụ mới');
    },
    onError: () => error('Thất bại', 'Không thể thêm chức vụ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => positionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'positions'] });
      success('Thành công', 'Đã xóa chức vụ');
    },
    onError: () => error('Thất bại', 'Không thể xóa chức vụ'),
  });

  const handleSave = () => {
    if (!newPosition.name) return;
    createMutation.mutate(newPosition);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải danh mục chức vụ...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục Chức vụ</h1>
          <p className="text-gray-500">Quản lý các vị trí công việc trong hệ thống</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm chức vụ
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Tên chức vụ</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Mô tả</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Lương cơ bản</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isAdding && (
              <tr className="bg-blue-50/50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: Barista"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={newPosition.description}
                    onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mô tả công việc"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={newPosition.base_salary}
                    onChange={(e) => setNewPosition({ ...newPosition, base_salary: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsAdding(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {positions.map((pos) => (
              <tr key={pos.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{pos.name}</td>
                <td className="px-6 py-4 text-gray-600">{pos.description}</td>
                <td className="px-6 py-4 text-gray-600">
                  {pos.base_salary.toLocaleString('vi-VN')} VND
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 text-gray-400">
                    <button className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate(pos.id)}
                      className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {positions.length === 0 && !isAdding && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Chưa có chức vụ nào được tạo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
