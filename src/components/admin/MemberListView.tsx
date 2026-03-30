/* src/components/admin/MemberListView.tsx */
import { useState } from 'react';
import { Search, Filter, CreditCard, Clock, User, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMembers } from '../../hooks/useMembers';
import PointChargeModal from './PointChargeModal';
import type { Member } from '../../lib/supabase';

const MemberListView = () => {
  const { members, loading, error, refresh } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<string>('All');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);

  const filteredMembers = members.filter(m => 
    (filterRank === 'All' || m.rank.toUpperCase() === filterRank.toUpperCase()) &&
    (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenCharge = (member: Member) => {
    setSelectedMember(member);
    setIsChargeModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-red-500">
        <p className="text-lg font-bold">Failed to load members</p>
        <p className="text-sm opacity-60">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
          <input 
            type="text"
            placeholder="회원 이름 또는 ID 검색..." 
            className="bg-slate-900/50 border border-white/5 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all w-[320px] text-white placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 mr-2" />
          {['All', 'VIP', 'DIAMOND', 'GOLD', 'SILVER'].map((rank) => (
            <button 
              key={rank}
              onClick={() => setFilterRank(rank)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filterRank === rank ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
              )}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/40 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Member Info</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rank</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Points</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Remaining Time</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-purple-500/30 transition-all">
                      <User className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-tight">{member.name}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tabular-nums">UID: @{member.user_id.split('-')[0]}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase",
                    member.rank === 'VIP' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    member.rank === 'Diamond' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                    member.rank === 'Gold' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-slate-800 text-slate-400 border border-white/5"
                  )}>
                    {member.rank}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-300 tabular-nums lowercase first-letter:uppercase">
                      {member.points.toLocaleString()} <span className="text-[10px] text-slate-600">pts</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-300 tabular-nums">
                      {member.remaining_time}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                      OFFLINE
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => handleOpenCharge(member)}
                    className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-[10px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20 rounded-xl transition-all"
                  >
                    Charge
                  </button>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PointChargeModal 
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        member={selectedMember}
        onSuccess={() => {
          if (refresh) refresh();
          else window.location.reload();
        }}
      />
    </div>
  );
};

export default MemberListView;
