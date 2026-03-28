/* src/components/client/FoodOrderModal.tsx */
import React, { useState, useEffect } from 'react';
import { X, ShoppingBasket, Plus, Minus, CheckCircle2, UtensilsCrossed, Coffee, Cookie, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface FoodOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'meal', label: 'Meals', icon: UtensilsCrossed },
  { id: 'drink', label: 'Drinks', icon: Coffee },
  { id: 'snack', label: 'Snacks', icon: Cookie },
];

const FoodOrderModal: React.FC<FoodOrderModalProps> = ({ isOpen, onClose }) => {
  const { user, member } = useAuth();
  const [activeCategory, setActiveCategory] = useState('meal');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [ordered, setOrdered] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          console.log('[FoodOrderModal] Fetching available products...');
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_available', true);
          
          if (error) {
            console.error('[FoodOrderModal] Supabase error:', error);
            throw error;
          }

          if (data) {
            console.log(`[FoodOrderModal] Successfully loaded ${data.length} products:`, data);
            setProducts(data);
          } else {
            console.warn('[FoodOrderModal] No available products found in database.');
            setProducts([]);
          }
        } catch (err) {
          console.error('[FoodOrderModal] Failed to fetch products:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter products by category (case-insensitive)
  const filteredProducts = products.filter(item => 
    item.category?.toLowerCase() === activeCategory.toLowerCase()
  );

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) newCart[id] -= 1;
      else delete newCart[id];
      return newCart;
    });
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = products.find(m => m.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);

  const handleOrder = async () => {
    if (!user || !member) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (member.points < totalAmount) {
      alert(`포인트가 부족합니다. (보유: ${member.points.toLocaleString()} PT)`);
      return;
    }

    try {
      setOrdered(true);
      
      // 방 번호 조회 (데모용으로 1번 좌석 고정)
      const { data: rooms } = await supabase.from('rooms').select('id').eq('room_number', 1).single();
      const roomId = rooms?.id;

      const orderItems = Object.entries(cart).map(([id, qty]) => {
        const item = products.find(m => m.id === id);
        return {
          product_id: item?.id,
          name: item?.name,
          count: qty,
          price: item?.price
        };
      });

      // 포인트 차감 및 주문 생성을 처리하는 RPC 호출 (트랜잭션 보장)
      const { data, error } = await supabase.rpc('pay_order', {
        p_user_id: user.id,
        p_room_id: roomId,
        p_total_price: totalAmount,
        p_order_items: orderItems
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.message || 'Payment failed');
      }

      setTimeout(() => {
        setOrdered(false);
        setCart({});
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Order failed:', error);
      alert(error.message || '주문에 실패했습니다. 포인트 잔액을 확인해주세요.');
      setOrdered(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-full max-h-[800px] bg-slate-900/40 border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex animate-in zoom-in-95 fade-in duration-500">
        
        {/* Left: Menu Area */}
        <div className="flex-1 flex flex-col border-r border-white/5">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                  <ShoppingBasket className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Food & Drinks</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Premium Refreshments</p>
               </div>
            </div>
            
            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/5">
               {CATEGORIES.map((cat) => (
                 <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                   "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                   activeCategory === cat.id ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                 >
                   <cat.icon className="w-3.5 h-3.5" />
                   {cat.label}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-0 grid grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar">
            {loading ? (
              <div className="col-span-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full h-full flex flex-col items-center justify-center opacity-20">
                <UtensilsCrossed className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No items in this category</p>
              </div>
            ) : filteredProducts.map((item) => {
              const isSoldOut = item.stock === 0;
              return (
                <div key={item.id} className={cn(
                  "group p-6 rounded-3xl bg-slate-800/30 border border-white/5 transition-all duration-300 relative",
                  isSoldOut ? "opacity-60 grayscale-[0.5]" : "hover:border-emerald-500/50"
                )}>
                  {isSoldOut && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="bg-slate-950/80 border border-red-500/50 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <span className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Sold Out</span>
                      </div>
                    </div>
                  )}
                  <div className="w-full aspect-square rounded-2xl bg-slate-900/50 flex items-center justify-center mb-4 overflow-hidden border border-white/5">
                    {item.image_url?.startsWith('http') ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300">{item.image_url}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">{item.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-emerald-400 font-black italic text-lg">{item.price.toLocaleString()}원</p>
                    {item.stock > 0 && item.stock <= 5 && (
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">
                        Only {item.stock} left
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => !isSoldOut && addToCart(item.id)}
                    disabled={isSoldOut}
                    className={cn(
                      "w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isSoldOut 
                        ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                        : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20"
                    )}
                  >
                    {isSoldOut ? 'Unavailable' : 'Add to Cart'}
                  </button>
                </div>
              );
            })}

          </div>
        </div>

        {/* Right: Cart Area */}
        <div className="w-[380px] bg-slate-950/40 flex flex-col">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">Your Order</h3>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {Object.entries(cart).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <ShoppingBasket className="w-16 h-16 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = products.find(m => m.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase">{item?.name}</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase mt-0.5">{(item?.price || 0).toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => removeFromCart(id)} className="p-1 rounded-md bg-white/5 text-slate-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-black text-white">{qty}</span>
                        <button onClick={() => addToCart(id)} className="p-1 rounded-md bg-white/5 text-slate-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-900 border-t border-white/10 space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Holding Credits</span>
                <span className="text-xs font-black text-emerald-400">{(member?.points || 0).toLocaleString()} PT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total cost</span>
                <span className="text-2xl font-black text-white italic tracking-tighter">{totalAmount.toLocaleString()}원</span>
              </div>
            </div>
            
            <button 
              disabled={Object.entries(cart).length === 0 || ordered}
              onClick={handleOrder}
              className={cn(
                "w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all duration-500",
                ordered ? "bg-emerald-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {ordered ? (
                <> <CheckCircle2 className="w-5 h-5" /> Order Placed </>
              ) : (
                "Complete Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodOrderModal;
