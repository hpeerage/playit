import { useState } from 'react';
import { Store, CheckCircle, Truck, ShoppingBag, LogIn } from 'lucide-react';
import { useDelivery } from '../hooks/useDelivery';
import { usePartnerOrders } from '../hooks/usePartnerOrders';

const STATUS_MAP = {
  'Pending': { label: '신규 주문', color: 'bg-rose-500', icon: ShoppingBag },
  'Delivering': { label: '배송중', color: 'bg-amber-500', icon: Truck },
  'Completed': { label: '완료됨', color: 'bg-emerald-500', icon: CheckCircle }
};

const PartnerLauncher = () => {
  const { partners, loading: partnersLoading } = useDelivery();
  
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  const { orders, updateOrderStatus } = usePartnerOrders(isAuthenticated ? selectedPartnerId : undefined);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')} ${formatTime(dateStr)}`;
  };

  const handleLogin = () => {
    if (selectedPartnerId) setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedPartnerId('');
  };

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const activeOrders = orders.filter(o => o.status === 'Delivering'); // Simplified! (No Cooking)
  const completedOrders = orders.filter(o => o.status === 'Completed').slice(0, 15); // 최근 15개만

  if (partnersLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 animate-pulse">Loading Partners...</div>;
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
        
        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-10 w-full max-w-md relative z-10 shadow-2xl flex flex-col items-center">
           <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
             <Store className="w-10 h-10 text-amber-500" />
           </div>
           
           <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Partner Login</h1>
           <p className="text-sm font-bold text-slate-400 mb-10 text-center">
             포스기(POS) 시스템 연동을 위해<br/>제휴 업체를 선택하고 로그인해주세요!
           </p>

           <div className="w-full space-y-4">
             <select 
               className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-4 font-bold text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
               value={selectedPartnerId}
               onChange={(e) => setSelectedPartnerId(e.target.value)}
             >
               <option value="" disabled>업체를 선택하세요</option>
               {partners.map(p => (
                 <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
               ))}
             </select>

             <button 
               onClick={handleLogin}
               disabled={!selectedPartnerId}
               className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
             >
               <LogIn className="w-5 h-5" /> Start POS System
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- POS DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4 text-amber-500">
          <Store className="w-8 h-8" />
          <h1 className="text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap">
            {selectedPartner?.name} <span className="text-sm font-bold text-slate-500 ml-2">POS SYSTEM</span>
          </h1>
        </div>

        <button 
          onClick={handleLogout}
          className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-colors text-sm"
        >
          로그아웃
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Pending Orders Sidebar (신규 주문) */}
        <div className="w-[400px] border-r border-white/5 bg-slate-900/30 flex flex-col relative z-0">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />
          
          <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
            <h2 className="text-xl font-black text-rose-400 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 animate-pulse" /> 신규 발주 내역
            </h2>
            <span className="bg-rose-500 text-white font-black px-3 py-1 rounded-full text-sm">
              {pendingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p className="font-bold">대기 중인 신규 주문이 없습니다.</p>
              </div>
            ) : pendingOrders.map(order => (
              <div key={order.id} className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(243,24,111,0.15)] animate-in slide-in-from-left-4 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">Station {order.rooms?.room_number || '?'}</h3>
                    <p className="text-xs text-rose-400 font-bold mt-1">{formatTime(order.created_at)} 주문 접수</p>
                  </div>
                  <span className="text-xl font-black text-amber-400">{order.total_amount.toLocaleString()}원</span>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <ul className="space-y-2">
                    {order.items.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.delivery_menus?.name}</span>
                        <span className="text-white font-bold">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {order.special_instructions && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-amber-300 font-bold p-2 bg-amber-500/10 rounded-lg">
                      요청: {order.special_instructions}
                    </div>
                  )}
                </div>
                
                {/* Simplified Status Button: Pending -> Delivering */}
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'Delivering')}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-lg transition-transform active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  주문 확인 (배송 시작)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active & Completed Orders Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-8 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-950 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />
            
            <div className="flex h-full gap-8 min-w-max">
              {/* 배달중 (진행 구역) */}
              <div className="w-[450px] flex flex-col bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-500" /> 배송 / 처리 중
                  </h3>
                  <span className="bg-white/10 text-white font-bold px-3 py-1 rounded-full text-xs">
                    {activeOrders.length}건
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {activeOrders.map(order => (
                    <div key={order.id} className="bg-slate-800 border border-amber-500/20 rounded-2xl p-5 group transition-all hover:bg-slate-800/80">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit mb-2 bg-amber-500/20 text-amber-400">
                             {STATUS_MAP[order.status as keyof typeof STATUS_MAP]?.label}
                           </span>
                           <h4 className="text-lg font-bold text-white leading-none">Station {order.rooms?.room_number || '?'}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{order.total_amount.toLocaleString()}원</div>
                          <div className="text-xs text-slate-400 font-medium mt-1">{formatTime(order.created_at)} 접수</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-300 mb-5">
                       {order.items.length === 1 
                         ? `${order.items[0].delivery_menus?.name}` 
                         : `${order.items[0].delivery_menus?.name} 외 ${order.items.length - 1}건`}
                      </div>
                      
                      {/* Simplified Status Button: Delivering -> Completed */}
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'Completed')}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> 배달 완료 처리
                      </button>
                    </div>
                  ))}
                  {activeOrders.length === 0 && (
                    <div className="text-center text-slate-500 font-bold py-10 opacity-50">진행 중인 배송 건이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 배달 완료 (최근 기록) */}
              <div className="w-[450px] flex flex-col bg-slate-900/20 border border-emerald-500/10 rounded-[32px] overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <div className="p-6 border-b border-emerald-500/10 flex items-center justify-between">
                  <h3 className="text-lg font-black text-emerald-500/70 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> 최근 완료 내역
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {completedOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                       <div>
                         <span className="text-sm font-bold text-white block">Station {order.rooms?.room_number || '?'} 배달완료</span>
                         <span className="text-xs text-slate-500 block">
                           {order.items.length === 1 ? order.items[0].delivery_menus?.name : `${order.items[0].delivery_menus?.name} 외 ${order.items.length - 1}개`}
                         </span>
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black text-emerald-500 block">{order.total_amount.toLocaleString()}원</span>
                         <span className="text-[10px] text-slate-500 font-bold block">{formatDateTime(order.created_at)}</span>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default PartnerLauncher;
