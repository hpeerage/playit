/* src/components/Header.tsx */
import React from 'react';
import { User as UserIcon, LogOut, Bell } from 'lucide-react';

interface HeaderProps {
  stats: {
    total: number;
    using: number;
    empty: number;
    pendingOrders: number;
  };
  currentTime: Date;
  unreadCount?: number;
  onBellClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ stats, currentTime, unreadCount, onBellClick }) => {
  return (
    <header className="header-premium h-[70px] bg-slate-950 border-b border-white/5 flex items-center px-[40px] justify-between z-[1000] relative">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all">
         <img 
           src="/playit-platform/logo.svg" 
           alt="Playit Logo" 
           className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] transition-all duration-300" 
         />
         <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter uppercase italic text-white leading-none">Playit</span>
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em]">Platform</span>
         </div>
      </div>

      {/* Live Summary Chips (Ant Design Style) */}
      <div className="flex-1 flex items-center justify-center gap-4 px-10">
         <div className="summary-chip bg-slate-800/50 text-slate-400 border border-white/5">
            <span className="opacity-60">전체:</span>
            <span>{stats.total}</span>
         </div>
         <div className="summary-chip bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="opacity-60">사용 중:</span>
            <span>{stats.using}</span>
         </div>
         <div className="summary-chip bg-slate-800/80 text-slate-300 border border-white/5">
            <span className="opacity-60">빈 객실:</span>
            <span>{stats.empty}</span>
         </div>
         <div className="summary-chip bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <span className="opacity-60">주문 대기:</span>
            <span>{stats.pendingOrders}</span>
         </div>
      </div>

      {/* Admin Profile & Clock */}
      <div className="flex items-center gap-8">
         <div className="flex flex-col items-end">
            <span className="text-xl font-black italic tabular-nums tracking-tighter text-white">
              {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">실시간 동기화</span>
         </div>
         
         <div className="flex items-center gap-2">
            <button 
              onClick={onBellClick}
              className="relative p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all group"
            >
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-slate-950 rounded-full text-[8px] font-black flex items-center justify-center text-white scale-110 animate-in zoom-in-50">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>
         </div>

         <div className="h-8 w-[1px] bg-white/10" />

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 py-1.5 pl-2 pr-4 rounded-xl border border-white/5">
               <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center border border-purple-500/30">
                  <UserIcon className="w-4 h-4 text-purple-400" />
               </div>
               <span className="text-sm font-black italic whitespace-nowrap">마스터_관리자</span>
            </div>
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.hash = '/login';
              }}
              className="p-2.5 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30 group"
            >
               <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
            </button>
         </div>
      </div>
    </header>
  );
};

export default Header;
