/* src/components/client/ClientHeader.tsx */
import { useState, useEffect } from 'react';
import { Clock, Battery, Wifi, User } from 'lucide-react';

const ClientHeader = () => {
  const [, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex justify-between items-start p-10 select-none">
      {/* Left: Branding / Station Info */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <img 
            src="/playit-platform/logo.svg" 
            alt="Playit Logo" 
            className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Station 24</span>
            </div>
            <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">PLAYIT <span className="text-purple-500">CLIENT</span></h1>
          </div>
        </div>
      </div>

      {/* Center/Right: Giant Stats */}
      <div className="flex flex-col items-end gap-2">
        <div className="bg-purple-900/20 backdrop-blur-md border border-purple-500/30 px-8 py-4 rounded-3xl shadow-2xl flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Remaining Time</span>
          </div>
          <div className="text-[64px] font-black tabular-nums leading-none tracking-tighter text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            02:14:45
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 px-4 py-2 bg-slate-900/40 rounded-full border border-white/5">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <User className="w-3.5 h-3.5" /> <span>WELCOME, <span className="text-white">JIWOO PARK</span></span>
           </div>
           <div className="flex items-center gap-3 text-slate-600">
              <Wifi className="w-4 h-4" />
              <Battery className="w-4 h-4" />
           </div>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
