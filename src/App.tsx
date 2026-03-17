/* src/App.tsx */
import { useState } from 'react';
import { LayoutDashboard, Settings, Bell, RefreshCw, Zap, TrendingUp, Users, Activity, LogOut, ChevronRight } from 'lucide-react';
import RoomCard from './components/RoomCard';
import type { Room } from './lib/supabase';
import { cn } from './lib/utils';

// Mock Data (301호 ~ 305호)
const INITIAL_ROOMS: Room[] = [
  { id: '1', room_number: '301', status: 'EMPTY', updated_at: new Date().toISOString() },
  { id: '2', room_number: '302', status: 'EMPTY', updated_at: new Date().toISOString() },
  { id: '3', room_number: '303', status: 'EMPTY', updated_at: new Date().toISOString() },
  { id: '4', room_number: '304', status: 'EMPTY', updated_at: new Date().toISOString() },
  { id: '5', room_number: '305', status: 'EMPTY', updated_at: new Date().toISOString() },
];

function App() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCheckIn = (id: string) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, status: 'USING', updated_at: new Date().toISOString() } : room
    ));
  };

  const handleCheckOut = (id: string) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, status: 'EMPTY', updated_at: new Date().toISOString() } : room
    ));
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const occupancyRate = (rooms.filter(r => r.status === 'USING').length / rooms.length) * 100;

  return (
    <div className="flex h-screen bg-[#050505] text-white selection:bg-brand-blue/30 overflow-hidden relative">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none grayscale-[0.8]"
        style={{ 
          backgroundImage: `url('playit_dashboard_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/95 to-[#050505] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="relative z-10 w-24 flex flex-col items-center py-10 border-r border-zinc-900/50 glass-panel bg-black/40">
        <div className="bg-gradient-brand p-3 rounded-2xl shadow-lg glow-purple mb-16 animate-pulse">
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>
        
        <nav className="flex flex-col gap-10 flex-1">
          {[LayoutDashboard, Activity, Users, Settings].map((Icon, i) => (
            <button key={i} className={cn(
              "p-4 rounded-2xl transition-all hover:bg-zinc-800 group relative",
              i === 0 ? "text-brand-blue bg-brand-blue/10" : "text-zinc-600 hover:text-white"
            )}>
              <Icon className="w-6 h-6" />
              {i === 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-blue rounded-r-full" />}
            </button>
          ))}
        </nav>

        <button className="p-4 rounded-2xl text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all">
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {/* Top Navigation */}
        <header className="h-20 px-10 flex items-center justify-between border-b border-zinc-900/40 bg-black/20 backdrop-blur-3xl sticky top-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Central Control Hub</span>
            <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              <span className="text-gradient">Playit</span> Platform
              <ChevronRight className="w-4 h-4 text-zinc-700" />
              <span className="font-medium text-zinc-400 normal-case tracking-tight italic">Operations Console</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 px-4 py-2 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500 glow-primary" />
              <span className="text-xs font-bold text-zinc-400">Server v1.0.4 Online</span>
            </div>
            <div className="flex bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/40 gap-1">
              {[Bell, RefreshCw].map((Icon, i) => (
                <button 
                  key={i} 
                  onClick={i === 1 ? handleManualSync : undefined}
                  className="p-2.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all active:scale-95"
                >
                  <Icon className={cn("w-5 h-5", i === 1 && isSyncing && "animate-spin")} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800/40">
              <div className="text-right">
                <p className="text-xs font-black text-white italic">Hpeerage Admin</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Master Key Access</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 p-0.5 glow-purple">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hpeerage" className="rounded-[10px]" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        <section className="p-10">
          {/* Stats Section with New Design */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Active Units', value: '5', icon: Activity, color: 'text-blue-400' },
              { label: 'Occupancy Rate', value: `${occupancyRate.toFixed(0)}%`, icon: TrendingUp, color: 'text-purple-400' },
              { label: 'Target Rooms', value: rooms.filter(r => r.status === 'USING').length, icon: Users, color: 'text-pink-400' },
              { label: 'System Health', value: '98.2%', icon: Zap, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-[2rem] p-8 flex justify-between items-start group">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600 mb-2 truncate">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black italic tracking-tighter text-white">{stat.value}</h3>
                  </div>
                </div>
                <div className={cn("p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/30 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black italic tracking-tight uppercase flex items-center gap-3">
              <div className="w-8 h-1 bg-brand-blue rounded-full" />
              Unit Control Grid
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Active</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-700" /> Empty</div>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                roomNumber={room.room_number}
                status={room.status}
                onCheckIn={() => handleCheckIn(room.id)}
                onCheckOut={() => handleCheckOut(room.id)}
              />
            ))}
          </div>

          {/* New Interactive Section: System Logs Placeholder */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 glass-card rounded-[2rem] p-8 min-h-[16rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[80px] -mr-32 -mt-32" />
               <h3 className="text-sm font-black italic tracking-widest uppercase text-zinc-500 mb-6 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Live Operation Logs
               </h3>
               <div className="space-y-4 font-mono text-[10px]">
                 {rooms.filter(r => r.status === 'USING').map((room, i) => (
                   <div key={i} className="flex gap-4 items-center animate-fadeIn">
                     <span className="text-emerald-500 font-bold">[{new Date().toLocaleTimeString()}]</span>
                     <span className="text-zinc-600">CLIENT_HANDSHAKE:</span>
                     <span className="text-white">Room {room.room_number} unit authorized. PC {room.id} power on sequence initiated.</span>
                   </div>
                 ))}
                 <div className="flex gap-4 items-center opacity-60">
                   <span className="text-zinc-500 font-bold">[{new Date().toLocaleTimeString()}]</span>
                   <span className="text-zinc-700">SYS_IDLE:</span>
                   <span className="text-zinc-500">Awaiting master control instructions. System heartbeat stable.</span>
                 </div>
               </div>
            </div>

            <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between bg-gradient-brand group hover:glow-purple transition-all duration-700 relative overflow-hidden">
              {/* Animation Layer */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <Zap className="w-12 h-12 text-white mb-6 group-hover:animate-bounce" />
                <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2 leading-none uppercase">Boost<br/>Efficiency</h3>
                <p className="text-xs font-bold text-white/70 italic leading-relaxed">Activate smart automation to reduce operational costs by up to 40%.</p>
              </div>
              <button className="relative z-10 w-full bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white mt-8 hover:bg-white/20 transition-all active:scale-95">
                Enable Auto-Control
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
