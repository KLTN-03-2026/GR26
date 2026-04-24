import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  Receipt, 
  Percent, 
  User, 
  Table2,
  Banknote,
  QrCode,
  Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useOrderStore } from '@/modules/order/stores/orderStore';
import { orderService } from '@/modules/order/services/orderService';
import { paymentService } from '@/modules/order/services/paymentService';
import type { OrderResponse, PaymentMethod } from '@/modules/order/types/order.types';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Tiền mặt', icon: <Wallet className="w-6 h-6 text-green-500" /> },
  { id: 'card', name: 'Thẻ ngân hàng', icon: <CreditCard className="w-6 h-6 text-blue-500" /> },
  { id: 'qr', name: 'Chuyển khoản / QR', icon: <Smartphone className="w-6 h-6 text-orange-500" /> },
];

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [qrStep, setQrStep] = useState<'IDLE' | 'GENERATING' | 'READY'>('IDLE');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  const { clearCart } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setIsLoadingOrder(true);
      try {
        const response = await orderService.getById(orderId);
        if (response.success && response.data) {
          setOrderData(response.data);
        } else {
          toast.error('Không tìm thấy thông tin đơn hàng');
          navigate(ROUTES.POS_ORDER);
        }
      } catch (error) {
        console.error('Fetch order failed:', error);
        toast.error('Lỗi khi tải thông tin đơn hàng');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const total = orderData?.totalAmount || 0;
  const subtotal = useMemo(() => {
    if (!orderData) return 0;
    return orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [orderData]);
  const tax = total - subtotal;

  const changeAmount = useMemo(() => {
    if (typeof amountReceived !== 'number' || !total) return 0;
    return Math.max(0, amountReceived - total);
  }, [amountReceived, total]);

  const canConfirm = useMemo(() => {
    if (selectedMethod === 'CASH') {
      return typeof amountReceived === 'number' && amountReceived >= total;
    }
    return true;
  }, [selectedMethod, amountReceived, total]);

  useEffect(() => {
    const fetchQR = async () => {
      if (selectedMethod === 'VIETQR' && orderId) {
        setQrStep('GENERATING');
        try {
          const response = await paymentService.generateQRPayment(orderId);
          if (response.success && response.data) {
            setQrCode(response.data.qrCode);
            setQrStep('READY');
          }
        } catch (error) {
          console.error('Generate QR failed:', error);
          toast.error('Lỗi khi sinh mã QR');
          setQrStep('IDLE');
        }
      } else {
        setQrStep('IDLE');
        setQrCode(null);
      }
    };

    fetchQR();
  }, [selectedMethod, orderId]);

  const handlePay = async () => {
    if (!orderId || !orderData) return;
    
    setIsProcessing(true);
    try {
      // 1. Khởi tạo thanh toán
      const initRes = await paymentService.initiatePayment(orderId, total, selectedMethod);
      if (initRes.success && initRes.data) {
        const paymentId = initRes.data.id;

        // 2. Xác nhận thanh toán (nếu là Tiền mặt)
        if (selectedMethod === 'CASH') {
          const confirmRes = await paymentService.confirmPayment(paymentId, {
            amountReceived,
            changeAmount
          });
          if (!confirmRes.success) {
            throw new Error(confirmRes.message || 'Xác nhận thất bại');
          }
        }
        
        // 3. Với VietQR, trong thực tế thường có webhook hoặc polling.
        // Ở đây giả định sau khi init/generate QR, ta đợi success logic.
        // Cho mục đích demo/skeleton, ta coi như thành công nếu cash confirm ok.
        
        setIsSuccess(true);
        clearCart();
        toast.success('Thanh toán thành công!');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-[32px] p-12 text-center shadow-sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-32 h-32 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100"
        >
          <CheckCircle2 className="w-16 h-16" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Thanh toán hoàn tất!</h1>
        <p className="text-slate-500 text-lg mb-8 max-w-md font-medium">Đơn hàng đã được xử lý thành công. Hóa đơn đã được gửi đến hàng đợi in.</p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="h-14 px-8 rounded-2xl border-2 font-bold hover:bg-slate-50 transition-all"
          >
            <Receipt className="mr-2 w-5 h-5" />
            In hóa đơn
          </Button>
          <Button 
            className="h-14 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold shadow-lg shadow-orange-100 transition-all"
            onClick={() => navigate(ROUTES.POS_ORDER)}
          >
            Đơn hàng mới
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 overflow-hidden p-2">
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl w-12 h-12 hover:bg-white hover:shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Thanh toán</h1>
            <p className="text-slate-500 font-medium">Xác nhận giao dịch và in hóa đơn</p>
          </div>
        </header>

        <div className="flex-1 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-hidden">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-orange-500" />
              Chi tiết đơn hàng
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
              {!orderData || orderData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300 italic">
                  Không có sản phẩm nào
                </div>
              ) : (
                orderData.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-xl font-black text-slate-700">{item.quantity}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.itemName}</span>
                        <span className="text-xs text-slate-400 font-medium">{item.unitPrice.toLocaleString('vi-VN')} ₫ / món</span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">{item.totalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t-2 border-slate-50 flex flex-col gap-3 mt-auto">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>VAT (8%)</span>
              <span>{tax.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-4xl font-black text-slate-900 mt-2 tracking-tighter">
              <span>Tổng thanh toán</span>
              <span className="text-orange-500">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[480px] flex flex-col gap-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col gap-8 h-full">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-slate-800">Phương thức thanh toán</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedMethod('CASH')}
                className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all duration-300 ${
                  selectedMethod === 'CASH' 
                    ? 'border-orange-500 bg-orange-50 shadow-xl shadow-orange-500/5 lg:scale-[1.02]' 
                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center ${selectedMethod === 'CASH' ? 'bg-white' : 'bg-slate-100'}`}>
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <span className="font-bold text-lg text-slate-800">Tiền mặt</span>
                {selectedMethod === 'CASH' && (
                  <motion.div layoutId="check" className="ml-auto">
                    <CheckCircle2 className="w-7 h-7 text-orange-500" />
                  </motion.div>
                )}
              </button>

              <button
                onClick={() => setSelectedMethod('VIETQR')}
                className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all duration-300 ${
                  selectedMethod === 'VIETQR' 
                    ? 'border-orange-500 bg-orange-50 shadow-xl shadow-orange-500/5 lg:scale-[1.02]' 
                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center ${selectedMethod === 'VIETQR' ? 'bg-white' : 'bg-slate-100'}`}>
                  <Smartphone className="w-6 h-6 text-orange-500" />
                </div>
                <span className="font-bold text-lg text-slate-800">VietQR</span>
                {selectedMethod === 'VIETQR' && (
                  <motion.div layoutId="check" className="ml-auto">
                    <CheckCircle2 className="w-7 h-7 text-orange-500" />
                  </motion.div>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedMethod === 'CASH' && (
              <motion.div 
                key="cash-ui"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4 bg-slate-50 p-6 rounded-[24px] border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-slate-700">Thanh toán tiền mặt</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Số tiền khách đưa</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="Nhập số tiền..."
                      className="h-14 pl-6 pr-12 rounded-2xl bg-white border-slate-100 text-xl font-black text-slate-800 focus-visible:ring-orange-500"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value) || '')}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₫</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-slate-500 font-medium">Tiền thừa trả khách:</span>
                  <span className="text-xl font-black text-emerald-500">{changeAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'VIETQR' && (
              <motion.div 
                key="qr-ui"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-[24px] border border-slate-100"
              >
                <div className="w-full flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-slate-700">Mã QR VietQR động</span>
                </div>
                
                <div className="w-48 h-48 bg-white rounded-3xl p-3 shadow-inner flex items-center justify-center border-2 border-dashed border-slate-200">
                  {qrStep === 'GENERATING' ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Đang sinh mã...</span>
                    </div>
                  ) : (
                    <motion.img 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SMARTFNB_ORDER_${total}`}
                      alt="VietQR"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái giao dịch</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-bold text-blue-600">Đang chờ thanh toán...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto pt-6 border-t border-slate-50">
            <Button 
              disabled={isProcessing || !canConfirm || !orderData}
              onClick={handlePay}
              className={`w-full h-16 rounded-[24px] text-xl font-black shadow-xl transition-all active:scale-95 group ${
                canConfirm 
                  ? 'bg-slate-900 hover:bg-orange-500 text-white shadow-slate-200' 
                  : 'bg-slate-100 text-slate-400 shadow-none'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Đang xác thực...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {!canConfirm ? 'Vui lòng nhập đủ tiền' : 'Xác nhận Đã thanh toán'}
                  {canConfirm && <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />}
                </div>
              )}
            </Button>
            <p className="text-center text-slate-400 text-[11px] font-medium leading-relaxed mt-4 px-4">
              Xác nhận thanh toán sẽ cập nhật trạng thái đơn hàng và in hóa đơn GTGT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
