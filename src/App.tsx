/* src/App.tsx */
import { useState, useMemo } from 'react';
import { 
  Zap, Monitor, Clock, LogOut, CheckCircle2, AlertCircle, ShoppingCart, User
} from 'lucide-react';
import RoomCard from './components/RoomCard';
import type { Room } from './lib/supabase';
import { cn } from './lib/utils';

// Generate 50 rooms for a professional PC room feel
const INITIAL_ROOMS: Room[] = Array.from({ length: 50 }).map((_, i) => ({
  id: (i + 1).toString(),
  room_number: (101 + i).toString(),
  status: (i % 7 === 0) ? 'USING' : (i % 12 === 0) ? 'MAINTENANCE' : 'EMPTY',
  updated_at: new Date().toISOString()
}));

function App() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId), 
    [rooms, selectedRoomId]
  );

  const stats = useMemo(() => {
    const using = rooms.filter(r => r.status === 'USING').length;
    const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
    return { using, maintenance, total: rooms.length };
  }, [rooms]);

  const handleAction = (roomId: string, newStatus: Room['status']) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e293b] text-[#f8fafc] font-sans selection:bg-purple-500/30">
      
      {/* 1. HEADER: Playit Admin Ribbon */}
      <header className="h-[60px] bg-[#0f172a] border-b border-white/5 flex items-center px-6 justify-between select-none shrink-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
           <div className="bg-[#8b5cf6] p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white fill-white" />
           </div>
           <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase italic text-white">Playit Admin</span>
              <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase opacity-60">Control Center Enterprise v2.0</span>
           </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-slate-500 font-bold uppercase">Total Units</span>
                 <span className="text-lg font-black italic">{stats.total}</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-[#8b5cf6] font-bold uppercase">Active PC</span>
                 <span className="text-lg font-black italic text-[#8b5cf6]">{stats.using}</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="flex flex-col items-end">
                 <span className="text-[10px] text-red-500 font-bold uppercase">Alerts</span>
                 <span className="text-lg font-black italic text-red-500">{stats.maintenance}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                 <User className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black italic">SUPER_MANAGER</span>
                 <span className="text-[8px] font-bold text-emerald-400 uppercase">Online</span>
              </div>
           </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: 10-Column Grid */}
      <main className="flex-1 flex overflow-hidden relative">
         <div className={cn(
           "flex-1 grid-container custom-scrollbar transition-all duration-300",
           selectedRoomId ? "mr-[400px]" : "mr-0"
         )}>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                roomNumber={room.room_number}
                status={room.status}
                remainingTime={room.status === 'USING' ? "03:45" : undefined}
                isSelected={selectedRoomId === room.id}
                onClick={() => setSelectedRoomId(room.id)}
              />
            ))}
         </div>

         {/* 3. DETAIL SIDEBAR (Right) */}
         <aside className={cn(
           "detail-sidebar transition-transform duration-300 ease-in-out",
           selectedRoomId ? "translate-x-0" : "translate-x-full"
         )}>
            {selectedRoom ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black italic uppercase tracking-tighter">Unit Details: {selectedRoom.room_number}</h3>
                   <button 
                     onClick={() => setSelectedRoomId(null)}
                     className="p-2 hover:bg-white/10 rounded-full transition-colors"
                   >
                     <Zap className="w-4 h-4 rotate-45 text-slate-500" />
                   </button>
                </div>

                <div className="space-y-6 flex-1">
                   {/* Status Card */}
                   <div className="p-5 rounded-2xl bg-[#1e293b] border border-white/5">
                      <div className="flex items-center gap-4 mb-4">
                         <div className={cn(
                           "w-12 h-12 rounded-xl flex items-center justify-center",
                           selectedRoom.status === 'USING' ? "bg-purple-500/20 text-[#8b5cf6]" : "bg-slate-800 text-slate-500"
                         )}>
                            <Monitor className="w-6 h-6" />
                         </div>
                         <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Status</div>
                            <div className={cn(
                              "text-base font-black italic",
                              selectedRoom.status === 'USING' ? "text-[#8b5cf6]" : "text-white"
                            )}>
                               {selectedRoom.status === 'USING' ? "SESSION ACTIVE" : "SYSTEM IDLE"}
                            </div>
                         </div>
                      </div>
                      
                      {selectedRoom.status === 'USING' && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                           <div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase">Check-in Time</div>
                              <div className="text-xs font-black italic">14:52:10</div>
                           </div>
                           <div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase">Duration</div>
                              <div className="text-xs font-black italic text-[#8b5cf6]">02h 45m</div>
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Order Status */}
                   <div className="p-5 rounded-2xl bg-[#1e293b] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Order Feed</span>
                         </div>
                         <span className="text-[10px] font-bold text-emerald-400">2 Items Pending</span>
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-[11px] bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-slate-300">Iced Americano (L)</span>
                            <span className="font-bold">$4.50</span>
                         </div>
                         <div className="flex justify-between text-[11px] bg-black/20 p-2 rounded border border-white/5">
                            <span className="text-slate-300">Spicy Ramen Combo</span>
                            <span className="font-bold">$8.90</span>
                         </div>
                      </div>
                   </div>

                   {/* Quick Actions */}
                   <div className="space-y-3 pt-4">
                      <button 
                        onClick={() => handleAction(selectedRoom.id, 'USING')}
                        className="w-full h-14 bg-[#8b5cf6] hover:bg-purple-600 rounded-xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                      >
                         <CheckCircle2 className="w-5 h-5" /> Approve Orders
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => handleAction(selectedRoom.id, 'MAINTENANCE')}
                           className="h-12 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                            <AlertCircle className="w-4 h-4" /> Error Flag
                         </button>
                         <button 
                           onClick={() => handleAction(selectedRoom.id, 'EMPTY')}
                           className="h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                            <LogOut className="w-4 h-4" /> Shutdown PC
                         </button>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-slate-500 uppercase">Last Sync</span>
                         <span className="text-[10px] font-black tracking-tight">{new Date().toLocaleTimeString()}</span>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-20">
                 <Monitor className="w-16 h-16 mb-4" />
                 <p className="text-xs font-black uppercase tracking-[0.5em] text-center">Select Room<br/>To Control</p>
              </div>
            )}
         </aside>
      </main>

      {/* 4. FOOTER BAR: Global Operational Summary */}
      <footer className="h-[24px] bg-[#0f172a] flex items-center px-6 justify-between shrink-0 select-none border-t border-white/5">
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-slate-500 italic uppercase tracking-widest flex items-center gap-2">
               <Zap className="w-3 h-3 text-[#8b5cf6]" /> Terminal Connection: Stable
            </span>
            <div className="h-3 w-[1px] bg-white/10" />
            <span className="text-[9px] font-bold text-slate-600">Peak Load Capacity: 84%</span>
         </div>
         <div className="flex items-center gap-4 text-[9px] font-black text-slate-700">
            SYSTEM_LOCAL_UPTIME: 312:44:02
         </div>
      </footer>
    </div>
  );
}

export default App;
