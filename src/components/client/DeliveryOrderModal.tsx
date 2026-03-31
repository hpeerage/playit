import { useState, useEffect, useMemo } from 'react';
import { X, Truck, MapPin, ChevronLeft, Plus, Minus, ShoppingBag, Store, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDelivery, type DeliveryPartner, type DeliveryMenu } from '../../hooks/useDelivery';
import { useDeliveryOrder, type OrderItemInput } from '../../hooks/useDeliveryOrder';

interface DeliveryOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string | null;
  roomNumber?: number;
}

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식', '야식', '치킨', '피자'];

const DeliveryOrderModal = ({ isOpen, onClose, roomId, roomNumber = 1 }: DeliveryOrderModalProps) => {
  const { partners, loading, fetchMenusByPartner } = useDelivery();
  const { placeOrder, loading: orderLoading } = useDeliveryOrder();

  const [activeCategory, setActiveCategory] = useState('전체');
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  
  const [menus, setMenus] = useState<DeliveryMenu[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [cart, setCart] = useState<(OrderItemInput & { name: string })[]>([]);

  // Filtering Logic
  const filteredPartners = useMemo(() => {
    if (activeCategory === '전체') return partners;
    return partners.filter(p => p.category === activeCategory);
  }, [partners, activeCategory]);

  const topPartners = filteredPartners.slice(0, 4);
  const remainingPartners = filteredPartners.slice(4);

  // Load menus when a partner is selected
  useEffect(() => {
    if (selectedPartner) {
      setMenusLoading(true);
      fetchMenusByPartner(selectedPartner.id).then(data => {
        setMenus(data);
        setMenusLoading(false);
      });
      // Clear cart when changing partner
      setCart([]);
    }
  }, [selectedPartner]);

  // Handle Cart
  const updateCart = (menu: DeliveryMenu, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_id === menu.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) return prev.filter(item => item.menu_id !== menu.id);
        return prev.map(item => item.menu_id === menu.id ? { ...item, quantity: newQuantity } : item);
      } else {
        if (delta > 0) {
          return [...prev, { menu_id: menu.id, name: menu.name, quantity: 1, price: menu.price }];
        }
        return prev;
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isCartValid = selectedPartner ? (cartTotal >= selectedPartner.min_order_amount) : false;

  const handlePlaceOrder = async () => {
    if (!selectedPartner || cart.length === 0 || !roomId) return;
    
    // We now have the real room UUID from ClientLauncher
    const success = await placeOrder(
      roomId,
      selectedPartner.id,
      cart,
      `[Station ${roomNumber}] 문 앞 보관 요청`
    );

    if (success) {
      alert('배달 주문이 성공적으로 접수되었습니다. 음식 도착 시 화면으로 안내해 드립니다!');
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedPartner(null);
    setCart([]);
    setActiveCategory('전체');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-white/5 relative z-10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            {selectedPartner ? (
              <button 
                onClick={() => setSelectedPartner(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                {selectedPartner ? selectedPartner.name : 'Delivery Partners'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-amber-500" />
                Playit PC ZONE, Station {roomNumber}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* View 1: Partner Selection */}
          {!selectedPartner && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Category Filters */}
              <div className="flex-none px-6 py-4 flex gap-2 overflow-x-auto custom-scrollbar border-b border-white/5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                      activeCategory === cat 
                        ? "bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Partner List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                   <div className="flex justify-center py-20">
                     <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : filteredPartners.length === 0 ? (
                   <div className="text-center py-20 text-slate-500 font-bold">
                     해당 카테고리에 등록된 업체가 없습니다.
                   </div>
                ) : (
                  <div className="space-y-8">
                    {/* Top 4 Big Cards */}
                    {topPartners.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {topPartners.map(partner => (
                          <button
                            key={partner.id}
                            onClick={() => setSelectedPartner(partner)}
                            className="bg-white/5 border border-white/5 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all group text-left flex flex-col"
                          >
                            <div className="h-40 relative overflow-hidden bg-slate-800">
                              {partner.image_url ? (
                                <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center"><Store className="w-8 h-8 text-white/20" /></div>
                              )}
                              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                                {partner.category}
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-black text-white text-lg">{partner.name}</h3>
                                <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-xs font-bold">
                                  <Star className="w-3 h-3 fill-current" /> {partner.rating}
                                </div>
                              </div>
                              <p className="text-sm text-slate-400 font-medium mb-3 line-clamp-1">{partner.description}</p>
                              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <span>최소주문 {partner.min_order_amount.toLocaleString()}원</span>
                                <span>배달팁 {partner.delivery_fee === 0 ? '무료' : `${partner.delivery_fee.toLocaleString()}원`}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Remaining List */}
                    {remainingPartners.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">추가 제휴 업체</h4>
                        {remainingPartners.map(partner => (
                          <button
                            key={partner.id}
                            onClick={() => setSelectedPartner(partner)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 rounded-xl p-4 flex items-center gap-4 transition-all text-left group"
                          >
                            <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 hidden sm:block">
                              {partner.image_url && <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white text-base">{partner.name}</h3>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 rounded">{partner.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{partner.description}</p>
                            </div>
                            <div className="shrink-0 text-right space-y-1">
                               <div className="flex items-center justify-end gap-1 text-amber-400 text-xs font-bold">
                                  <Star className="w-3 h-3 fill-current" /> {partner.rating}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  최소 {partner.min_order_amount.toLocaleString()}원
                                </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View 2: Menu / Partner Selected */}
          {selectedPartner && (
            <div className="flex-1 flex overflow-hidden">
              {/* Menu List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {menusLoading ? (
                   <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                 ) : menus.length === 0 ? (
                   <div className="text-center py-20 text-slate-500 font-bold">등록된 메뉴가 없습니다.</div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {menus.map(menu => {
                       const cartItem = cart.find(c => c.menu_id === menu.id);
                       const quantity = cartItem?.quantity || 0;

                       return (
                         <div key={menu.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                           <div className="w-24 h-24 rounded-xl bg-slate-800 shrink-0 overflow-hidden">
                             {menu.image_url && <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                           </div>
                           <div className="flex-1 flex flex-col">
                             <h4 className="font-bold text-white leading-tight mb-1">{menu.name}</h4>
                             <p className="text-xs text-slate-400 line-clamp-2 mb-2">{menu.description}</p>
                             <div className="mt-auto flex items-center justify-between">
                               <span className="font-black text-amber-400">{menu.price.toLocaleString()}원</span>
                               
                               {quantity > 0 ? (
                                 <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                                   <button onClick={() => updateCart(menu, -1)} className="p-1 text-slate-400 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                                   <span className="text-xs font-bold text-white w-4 text-center">{quantity}</span>
                                   <button onClick={() => updateCart(menu, 1)} className="p-1 text-slate-400 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                                 </div>
                               ) : (
                                 <button onClick={() => updateCart(menu, 1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
                                   담기
                                 </button>
                               )}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>

              {/* Cart / Order Sidebar */}
              <div className="w-80 border-l border-white/5 bg-slate-900/40 flex flex-col">
                <div className="p-6 border-b border-white/5">
                  <h3 className="font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" /> My Cart
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <ShoppingBag className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-bold">장바구니가 비어있습니다.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.menu_id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white line-clamp-1">{item.name}</div>
                          <div className="text-xs text-amber-400 font-medium">{(item.price * item.quantity).toLocaleString()}원</div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2 py-1 ml-2">
                           <span className="text-xs font-bold text-slate-300 w-4 text-center">{item.quantity}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-white">{cartTotal.toLocaleString()}원</span>
                  </div>
                  
                  {selectedPartner && cartTotal > 0 && cartTotal < selectedPartner.min_order_amount && (
                    <p className="text-xs text-rose-400 font-bold mb-3 text-center">
                      최소 주문 금액({selectedPartner.min_order_amount.toLocaleString()}원)을 채워주세요.
                    </p>
                  )}

                  <button 
                    disabled={!isCartValid || orderLoading}
                    onClick={handlePlaceOrder}
                    className="w-full h-14 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  >
                    {orderLoading ? (
                       <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                       `${cartTotal > 0 ? cartTotal.toLocaleString() + '원 ' : ''}배달 주문하기`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DeliveryOrderModal;
