import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  ChevronRight, 
  Coffee, 
  IceCream, 
  Cake, 
  Milk, 
  GlassWater
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useOrderStore } from '@/modules/order/stores/orderStore';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: <ShoppingCart className="w-5 h-5" /> },
  { id: 'ca-phe', name: 'Cà phê', icon: <Coffee className="w-5 h-5" /> },
  { id: 'tra-trai-cay', name: 'Trà trái cây', icon: <IceCream className="w-5 h-5" /> },
  { id: 'banh-ngot', name: 'Bánh ngọt', icon: <Cake className="w-5 h-5" /> },
  { id: 'da-ep', name: 'Đá ép', icon: <GlassWater className="w-5 h-5" /> },
  { id: 'sua-hat', name: 'Sữa hạt', icon: <Milk className="w-5 h-5" /> },
];

const MOCK_MENU_ITEMS = [
  { id: '1', name: 'Cà phê Muối', price: 35000, category: 'ca-phe', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '2', name: 'Trà Đào Cam Sả', price: 45000, category: 'tra-trai-cay', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '3', name: 'Bánh Tiramisu', price: 55000, category: 'banh-ngot', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '4', name: 'Nước Ép Cam', price: 40000, category: 'da-ep', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '5', name: 'Sữa Hạnh Nhân', price: 45000, category: 'sua-hat', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '6', name: 'Cà phê Đen Đá', price: 25000, category: 'ca-phe', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200&h=200&auto=format&fit=crop' },
];

const OrderPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    placeOrder,
    isLoading 
  } = useOrderStore();
  
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    return MOCK_MENU_ITEMS.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    const success = await placeOrder();
    if (success) {
      navigate(ROUTES.POS_PAYMENT);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden">
      <aside className="w-64 flex flex-col gap-2 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <h2 className="px-4 py-2 text-lg font-bold text-slate-800">Danh mục</h2>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              selectedCategory === cat.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.icon}
            <span className="font-medium">{cat.name}</span>
          </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Tìm kiếm món ăn..." 
              className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 group hover:border-orange-500 transition-colors"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="px-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-500 font-bold">
                        {item.price.toLocaleString('vi-VN')} ₫
                      </span>
                      <Button 
                        size="icon" 
                        onClick={() => addToCart(item)}
                        className="rounded-xl w-10 h-10 bg-slate-900 hover:bg-orange-500"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <aside className="w-96 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            Giỏ hàng
          </h2>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
            {cart.length} món
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 h-full custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p className="font-medium">Giỏ hàng đang trống</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={item.id} 
                className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-slate-200">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-700">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-lg text-orange-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-slate-900">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính</span>
              <span className="font-medium">{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT (8%)</span>
              <span className="font-medium">{tax.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 mt-2">
              <span>Tổng cộng</span>
              <span className="text-orange-500">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
            <Button 
              onClick={handlePlaceOrder}
              disabled={isLoading || cart.length === 0}
              className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-lg font-bold shadow-lg shadow-orange-200 mt-4"
            >
              {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
              {!isLoading && <ChevronRight className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default OrderPage;
