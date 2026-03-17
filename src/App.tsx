/* src/App.tsx */
import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, RefreshCw, Zap, Users, Activity, 
  ChevronRight, Monitor, Clock, Package, DollarSign, Database, CreditCard, 
  Calendar, Layers, MessageSquare, Search, Info, Terminal
} from 'lucide-react';
import RoomCard from './components/RoomCard';
import type { Room } from './lib/supabase';
import { cn } from './lib/utils';

// Mock Data Generation for ERP Experience (~40 Rooms)
const INITIAL_ROOMS: Room[] = Array.from({ length: 40 }).map((_, i) => ({
  id: (i + 1).toString(),
  room_number: (301 + i).toString(),
  status: Math.random() > 0.6 ? 'USING' : Math.random() > 0.1 ? 'EMPTY' : 'CLEANING',
  updated_at: new Date().toISOString()
}));

function App() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | '1F' | '2F' | 'VIP'>('ALL');

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId), 
    [rooms, selectedRoomId]
  );

  const stats = useMemo(() => {
    const using = rooms.filter(r => r.status === 'USING').length;
    const rate = (using / rooms.length) * 100;
    return { using, rate, total: rooms.length };
  }, [rooms]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const menuItems = [
    { label: '매장 관리', icon: LayoutDashboard },
    { label: '회원 정보', icon: Users },
    { label: '요금 관리', icon: CreditCard },
    { label: '결제 관리', icon: DollarSign },
    { label: '상품 판매', icon: Package },
    { label: '보고서', icon: Activity },
    { label: '더보기', icon: ChevronRight },
  ];

  const subMenuItems = [
    '연수기관리', '당일매출', '요금제', '상품판매', '결제내역', '좌석예약표시', '메시지', '손님검색'
  ];

  return (
    <div className="flex flex-col h-screen bg-[#121214] text-white selection:bg-cyan-500/30 font-sans overflow-hidden">
      
      {/* 1. Top Ribbon Navigation (Professional Management Bar) */}
      <header className="h-[60px] bg-[#1e1e22] border-b border-black flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
             <div className="bg-cyan-500 p-1.5 rounded-sm">
                <Zap className="w-4 h-4 text-black fill-black" />
             </div>
             <span className="font-black text-lg tracking-tighter uppercase italic text-cyan-500">Playit ERP</span>
          </div>
          
          <nav className="flex items-center gap-1">
            {menuItems.map((item, i) => (
              <button key={i} className="px-4 h-[60px] text-zinc-400 hover:text-white hover:bg-black/20 text-[13px] font-bold transition-colors">
                 {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
               type="text" 
               placeholder="좌석/회원 검색" 
               className="bg-[#121214] border border-[#2a2a2e] rounded-sm pl-9 pr-4 py-1.5 text-[12px] w-48 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button onClick={handleManualSync} className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors">
            <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* 2. Sub Menu / Status Bar */}
      <div className="h-[40px] bg-[#2a2a2e] border-b border-black flex items-center px-4 justify-between">
         <div className="flex items-center gap-1">
           <button className="p-2 text-zinc-400 hover:text-white"><Layers className="w-4 h-4" /></button>
           <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
           {subMenuItems.map((item, i) => (
             <button key={i} className="px-3 h-[40px] text-[12px] text-zinc-300 hover:text-white transition-colors">
               {item}
             </button>
           ))}
           <button className="w-6 h-6 rounded-sm bg-orange-500 flex items-center justify-center text-black font-black">+</button>
         </div>

         <div className="flex items-center gap-6 text-[12px] font-bold">
            <div className="flex items-center gap-2">
               <span className="text-zinc-500 uppercase tracking-tighter">가동률</span>
               <span className="text-cyan-400 font-mono">{stats.rate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-zinc-500 uppercase tracking-tighter">사용좌석</span>
               <span className="text-white font-mono">{stats.using} / {stats.total}</span>
            </div>
         </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Info (Selected Room Details) */}
        <aside className="w-[280px] bg-[#1e1e22] border-r border-black flex flex-col p-4 overflow-y-auto select-none">
          <div className="mb-6 flex items-center justify-between">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-600 italic">User Information</h3>
             <button className="text-zinc-600 hover:text-white transition-colors"><Info className="h-4 w-4" /></button>
          </div>

          {selectedRoom && selectedRoom.status === 'USING' ? (
            <div className="animate-fadeIn">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 p-1 flex-shrink-0">
                   <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedRoom.id}`} alt="User" className="w-full h-full object-cover rounded-md" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-[10px] text-zinc-500 mb-0.5">Room {selectedRoom.room_number}</div>
                   <div className="text-sm font-bold tracking-tight text-white italic truncate">PLAYIT_GUEST_{selectedRoom.id}</div>
                   <div className="text-[9px] text-cyan-400 uppercase font-black tracking-widest">Premium Member</div>
                 </div>
               </div>

               <div className="space-y-3 mb-8">
                 {[
                   { label: '시작 시간', value: '2024-12-21 18:32', icon: Calendar },
                   { label: '남은 시간', value: '12시간 18분', icon: Clock, color: 'text-amber-500' },
                   { label: '이용 금액', value: '14,500원', icon: DollarSign },
                   { label: '포인트', value: '850p', icon: Database },
                 ].map((row, i) => (
                   <div key={i} className="flex items-center justify-between p-2.5 rounded-sm bg-black/20 border border-zinc-900/50">
                     <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <row.icon className="w-3.5 h-3.5" />
                        <span>{row.label}</span>
                     </div>
                     <span className={cn("text-[11px] font-bold text-zinc-300", row.color)}>{row.value}</span>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white transition-all">
                    <MessageSquare className="w-4 h-4" /> 메시지
                 </button>
                 <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white transition-all">
                    <Terminal className="w-4 h-4" /> 시간연장
                 </button>
                 <button className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-sm text-[11px] font-black uppercase tracking-widest text-black col-span-2 transition-all">
                    <Package className="w-4 h-4" /> 주문 내역
                 </button>
               </div>
            </div>
          ) : selectedRoom ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-700 animate-fadeIn">
               <Monitor className="w-16 h-16 mb-4 stroke-[1]" />
               <p className="text-xs font-bold uppercase tracking-widest">Room {selectedRoom.room_number}</p>
               <p className="text-[10px] text-zinc-800">No Active Session</p>
               <button 
                  onClick={() => setRooms(prev => prev.map(r => r.id === selectedRoom.id ? {...r, status: 'USING'} : r))}
                  className="mt-6 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-sm uppercase tracking-widest transition-all"
               >
                 Force Check-In
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-800 italic">
               <p className="text-[11px]">Select a room for details</p>
            </div>
          )}
          
          <div className="mt-auto border-t border-zinc-900 pt-4 flex flex-col gap-2">
             <div className="flex items-center gap-3 p-3 bg-black/40 border border-zinc-950 rounded-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 glow-primary" />
                <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">System Operational</span>
             </div>
          </div>
        </aside>

        {/* Dashboard Surface (Grid) */}
        <section className="flex-1 flex flex-col p-4 bg-[#121214] overflow-hidden">
           
           <div className="mb-4 flex gap-4 border-b border-zinc-900 pb-2">
             {['ALL', '1F', '2F', 'VIP'].map((tab) => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={cn(
                   "px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-sm transition-all border",
                   activeTab === tab 
                    ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" 
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                 )}
               >
                 {tab} SECTION
               </button>
             ))}
           </div>

           <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-[4px]">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    roomNumber={room.room_number}
                    status={room.status}
                    userName={room.status === 'USING' ? `GUEST_${room.id}` : undefined}
                    timeUsed={room.status === 'USING' ? '02:45:12' : undefined}
                    isSelected={selectedRoomId === room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                  />
                ))}
              </div>
           </div>
        </section>
      </div>

      {/* 4. Footer Bar (Sales & Summary) */}
      <footer className="h-[35px] bg-[#1e1e22] border-t border-black flex items-center px-4 justify-between select-none text-[11px] font-bold">
         <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <span className="text-zinc-600 uppercase">인수금액:</span>
             <span className="text-white">1,450,650 원</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-zinc-600 uppercase">카운터 현금:</span>
             <span className="text-white">100,000 원</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-zinc-600 uppercase">판매기/기기 금고:</span>
             <span className="text-white">800,000 원</span>
           </div>
         </div>

         <div className="flex items-center gap-4">
            <span className="text-zinc-500 uppercase tracking-widest mr-2">합계:</span>
            <span className="text-lg font-black text-cyan-400 italic font-mono leading-none">12,250,650 원</span>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-sm text-emerald-500 text-[10px]">연결이상무</div>
         </div>
      </footer>
    </div>
  );
}

export default App;
