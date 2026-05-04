import type { SupplierDebt } from '../../types/supplier.types';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Progress } from '@shared/components/ui/progress';
import { AlertCircle, CheckCircle2, Wallet, History } from 'lucide-react';

interface DebtTabProps {
  debt?: SupplierDebt | null;
}

export const DebtTab = ({ debt }: DebtTabProps) => {
  if (!debt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <History className="w-12 h-12 mb-4 text-gray-300" />
        <p>Hiện không có dữ liệu công nợ cho nhà cung cấp này</p>
      </div>
    );
  }

  const paymentRatio = (debt.paidAmount / debt.totalDebt) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Tổng công nợ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">{debt.totalDebt.toLocaleString()} đ</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Đã thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{debt.paidAmount.toLocaleString()} đ</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Còn nợ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{debt.remainingAmount.toLocaleString()} đ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Tiến độ thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tỷ lệ hoàn tất</span>
            <span className="font-semibold text-gray-900">{paymentRatio.toFixed(1)}%</span>
          </div>
          <Progress value={paymentRatio} className="h-2 bg-gray-100" />
          <div className="flex justify-between items-center text-xs text-gray-400 italic pt-2">
            <span>Lần thanh toán cuối: {debt.lastPaymentDate || 'Chưa có thông tin'}</span>
            <span>Trạng thái: {debt.remainingAmount === 0 ? 'Đã tất toán' : 'Chưa tất toán'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
