import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  ChevronRight, 
  Coffee, 
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import { useOrderStore } from '@modules/order/stores/orderStore';
import { menuService } from '@modules/menu/services/menuService';
import type { MenuItem, MenuItemCategory } from '@modules/menu/types/menu.types';
import toast from 'react-hot-toast';

const OrderPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    placeOrder,
    isLoading: isPlacingOrder 
  } = useOrderStore();
  
  const navigate = useNavigate();

  // Fetch both categories and menu items
  const fetchData = async () => {
    setIsPageLoading(true);
    setError(null);
    try {
      const [catRes, itemRes] = await Promise.all([
        menuService.getCategories(),
        menuService.getList({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined,
          pageSize: 100
        })
      ]);
      
      setCategories([
        { id: 'all', name: 'Tất cả', icon: <ShoppingCart className="w-5 h-5" /> },
        ...catRes.data.map(c => ({
          id: c.id,
          name: c.name,
          icon: <Coffee className="w-5 h-5" />
        }))
      ]);
      setMenuItems(itemRes.data);
    } catch (err) {
      console.error('Menu load error:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      toast.error('Lỗi khi tải dữ liệu thực đơn');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const success = await placeOrder();
    if (success) {
      navigate(ROUTES.POS_PAYMENT);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden">
      <aside className="w-64 flex flex-col gap-2 bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-bold text-slate-800">Danh mục</h2>
          <Button variant="ghost" size="sm" onClick={() => fetchData()} className="h-8 w-8 p-0">
            <RefreshCcw className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left ${
                selectedCategory === cat.id 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={selectedCategory === cat.id ? 'text-white' : 'text-orange-500'}>
                {cat.icon || <Coffee className="w-5 h-5" />}
              </div>
              <span className="font-medium truncate">{cat.name}</span>
            </button>
          ))}
        </div>
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
          {isPageLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
              <p className="font-medium animate-pulse">Đang tải thực đơn...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <RefreshCcw className="w-12 h-12 opacity-20" />
              <p className="font-medium">{error}</p>
              <Button onClick={() => fetchData()} variant="outline" className="rounded-xl">Thử lại</Button>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <Search className="w-12 h-12 opacity-20" />
              <p className="font-medium">Không tìm thấy món ăn phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              <AnimatePresence mode="popLayout">
                {menuItems.map(item => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 group hover:border-orange-500 transition-colors"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-white font-black text-xs uppercase tracking-widest px-3 py-1 bg-red-500 rounded-full">Hết hàng</span>
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-orange-500 font-bold">
                          {item.price.toLocaleString('vi-VN')} ₫
                        </span>
                        <Button 
                          size="icon" 
                          disabled={!item.isAvailable}
                          onClick={() => addToCart({ 
                            id: item.id, 
                            name: item.name, 
                            price: item.price, 
                            category: item.category, 
                            image: item.image 
                          })}
                          className={`rounded-xl w-10 h-10 ${item.isAvailable ? 'bg-slate-900 hover:bg-orange-500' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
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
              disabled={isPlacingOrder || cart.length === 0}
              className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-lg font-bold shadow-lg shadow-orange-200 mt-4"
            >
              {isPlacingOrder ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  Đặt món & Thanh toán
                  <ChevronRight className="ml-1 w-5 h-5" />
                </div>
              )}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default OrderPage;
