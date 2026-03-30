/* src/components/GNB.tsx - Premium Slim Version */
import React from 'react';
import { Shield, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface GNBProps {
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  items: { id: string, icon: LucideIcon, label: string }[];
}

const GNB: React.FC<GNBProps> = ({ activeMenu, setActiveMenu, items }) => {
  const menuItems = items;

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-[80px] hover:w-[220px] bg-[#020617] border-r border-white/5 z-[3000] flex flex-col items-center py-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group/gnb shadow-2xl">
      {/* Brand Icon */}
      <div className="mb-12 flex items-center justify-center w-full px-6">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="ml-4 font-black italic text-xl tracking-tighter text-white opacity-0 group-hover/gnb:opacity-100 transition-opacity whitespace-nowrap">GAMER HUB</span>
      </div>

      <div className="flex-1 w-full space-y-2 px-3">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={cn(
              "flex items-center h-12 w-full rounded-xl cursor-pointer transition-all duration-200 group relative",
              activeMenu === item.id ? "bg-purple-600 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <div className="min-w-[56px] flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-0 group-hover/gnb:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
            {activeMenu === item.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full shadow-[0_0_10px_white]" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 w-full">
         <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center hover:border-purple-500/30 transition-colors cursor-pointer group/sett">
            <Settings className="w-5 h-5 text-slate-600 group-hover/sett:text-purple-400 group-hover/sett:rotate-90 transition-all" />
         </div>
      </div>
    </nav>
  );
};

export default GNB;
