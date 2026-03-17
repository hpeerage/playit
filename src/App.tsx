/* src/App.tsx */
import { useState } from 'react';
import { LayoutDashboard, Settings, Bell, RefreshCw, Zap } from 'lucide-react';
import RoomCard from './components/RoomCard';
import type { Room } from './lib/supabase';

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

  // 시뮬레이션: 체크인 처리
  const handleCheckIn = (id: string) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, status: 'USING', updated_at: new Date().toISOString() } : room
    ));
    // 실제 Supabase 연동 시 여기에 supabase.from('rooms').update(...) 추가
    console.log(`Room ${id} checked in`);
  };

  // 시뮬레이션: 체크아웃 처리
  const handleCheckOut = (id: string) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, status: 'EMPTY', updated_at: new Date().toISOString() } : room
    ));
    console.log(`Room ${id} checked out`);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-800 bg-black/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Playit</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hpeerage" alt="User" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest leading-none">Developer Dashboard</span>
            </div>
            <h1 className="text-4xl font-black mb-2">Platform Overview</h1>
            <p className="text-zinc-400">실시간 객실 상태 및 PC 원격 제어 현황을 한눈에 파악합니다.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleManualSync}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <RefreshCw className={isSyncing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              상태 동기화
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: '전체 객실', value: '5', desc: 'Active' },
            { label: '사용 중', value: rooms.filter(r => r.status === 'USING').length, desc: 'Realtime' },
            { label: '가동률', value: `${(rooms.filter(r => r.status === 'USING').length / 5 * 100).toFixed(0)}%`, desc: 'Today' },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-2xl">
              <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono">{stat.value}</span>
                <span className="text-xs text-zinc-600 font-bold uppercase">{stat.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

        {/* System Info (Footer-like) */}
        <div className="mt-20 p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-zinc-500" />
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                <span className="text-zinc-500">Supabase Connection</span>
                <span className="text-emerald-500 font-medium">Stable</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                <span className="text-zinc-500">Realtime Channel</span>
                <span className="text-emerald-500 font-medium">rooms_status_v1</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                <span className="text-zinc-500">Environment</span>
                <span className="text-zinc-300">Phase 1 (MVP)</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                <span className="text-zinc-500">Last Deploy</span>
                <span className="text-zinc-300">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
