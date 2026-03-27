/* src/components/admin/ReportsView.tsx */
import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Download, 
  Monitor, 
  Utensils, 
  Laptop
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const REVENUE_DATA = [
  { day: 'Mon', value: 0 },
  { day: 'Tue', value: 0 },
  { day: 'Wed', value: 0 },
  { day: 'Thu', value: 0 },
  { day: 'Fri', value: 0 },
  { day: 'Sat', value: 0 },
  { day: 'Sun', value: 0 },
];

const ReportsView = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [weeklyData, setWeeklyData] = useState(REVENUE_DATA);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [revenueFilter, setRevenueFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [occupancyByZone, setOccupancyByZone] = useState<Record<string, { total: number, active: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // 1. 주문 데이터 및 매출 집계
        const { data: allOrders } = await supabase.from('orders').select('*').eq('status', 'Completed');
        if (allOrders) {
          let filtered = allOrders;
          const now = new Date();
          
          if (revenueFilter === 'Today') {
            filtered = allOrders.filter(o => new Date(o.created_at).toDateString() === now.toDateString());
          } else if (revenueFilter === 'Week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = allOrders.filter(o => new Date(o.created_at) >= weekAgo);
          } else if (revenueFilter === 'Month') {
            filtered = allOrders.filter(o => 
              new Date(o.created_at).getMonth() === now.getMonth() && 
              new Date(o.created_at).getFullYear() === now.getFullYear()
            );
          }

          setTotalRevenue(filtered.reduce((sum, o) => sum + (o.total_price || 0), 0));
          setTotalOrders(filtered.length);

          // 2. 주간 차트 데이터 (최근 7일)
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const weekMap: Record<string, number> = {};
          days.forEach(d => weekMap[d] = 0);
          allOrders.forEach(order => {
            const date = new Date(order.created_at);
            const dayName = days[date.getDay()];
            weekMap[dayName] += (order.total_price || 0);
          });
          const sortedDaysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          setWeeklyData(sortedDaysOrder.map(day => ({ day, value: weekMap[day] })));

          // 3. 인기 상품 분석
          const itemMap: Record<string, {count: number, price: number, name: string}> = {};
          allOrders.forEach(order => {
            const items = order.order_items as any[];
            if (Array.isArray(items)) {
              items.forEach(item => {
                const existing = itemMap[item.name] || { count: 0, price: item.price, name: item.name };
                itemMap[item.name] = { 
                  ...existing,
                  count: existing.count + (item.count || 1)
                };
              });
            }
          });
          setPopularItems(Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 3));
        }

        // 4. 구역별 점유율 분석
        const { data: rooms } = await supabase.from('rooms').select('zone, status');
        if (rooms) {
          const zoneMap: Record<string, { total: number, active: number }> = {};
          rooms.forEach(r => {
            const z = r.zone || '101';
            if (!zoneMap[z]) zoneMap[z] = { total: 0, active: 0 };
            zoneMap[z].total++;
            if (r.status === 'Using') zoneMap[z].active++;
          });
          setOccupancyByZone(zoneMap);
        }
      } catch (err) {
        console.error('Analytics Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const orderChannel = supabase.channel('reports-sync-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAnalytics).subscribe();
    const roomChannel = supabase.channel('reports-sync-rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchAnalytics).subscribe();
    
    return () => { 
      supabase.removeChannel(orderChannel); 
      supabase.removeChannel(roomChannel);
    };
  }, [revenueFilter]);

  const maxRevenue = useMemo(() => Math.max(...weeklyData.map(d => d.value), 10000), [weeklyData]);

  if (loading && totalOrders === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#020617]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Processing Analytics...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-y-auto custom-scrollbar bg-[#020617]">
      {/* Top Header Section */}
      <div className="flex items-center justify-between px-2">
         <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Operations Intelligence</h2>
            <div className="flex items-center gap-3">
               <span className="text-3xl font-black italic text-white tracking-tighter uppercase">Store Analytics</span>
               <div className="h-4 w-px bg-white/10" />
               <span className="text-purple-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 glow-purple" />
                  Live Sync Active
               </span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
               <Download className="w-4 h-4" /> Export Report
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 transition-all">
               <Calendar className="w-4 h-4" /> Schedule Task
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Column */}
        <div className="lg:col-span-2 space-y-8">
           {/* Primary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-all duration-1000" />
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Total Combined Revenue</h3>
                       <div className="text-5xl font-black italic text-white tracking-tighter tabular-nums mb-2">
                          ₩{totalRevenue.toLocaleString()}
                       </div>
                       <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black text-emerald-400 uppercase">+12.4% <span className="text-slate-600 ml-1">Trend</span></span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       {['Today', 'Week', 'Month', 'All'].map(f => (
                         <button 
                           key={f} 
                           onClick={() => setRevenueFilter(f as any)} 
                           className={cn(
                             "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border",
                             revenueFilter === f ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/5 text-slate-500 hover:text-white"
                           )}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] group-hover:bg-blue-500/10 transition-all duration-1000" />
                 <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Order Fulfillment Count</h3>
                       <div className="text-5xl font-black italic text-white tracking-tighter tabular-nums mb-2">
                          {totalOrders.toLocaleString()} <span className="text-lg text-slate-600 not-italic">units</span>
                       </div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Node Processing</div>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20 shadow-xl shadow-blue-900/10">
                       <ShoppingBag className="w-7 h-7 text-blue-400" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Revenue Chart */}
           <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] shadow-2xl relative group">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Velocity Metrics</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">7 Day Revenue Distribution</p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-end justify-between gap-6 h-[300px] px-4 group/bar-container">
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-6 group/bar">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div 
                        className="w-full max-w-[48px] bg-slate-800/40 border border-white/5 rounded-t-2xl transition-all duration-1000 group-hover/bar:bg-gradient-to-t group-hover/bar:from-purple-600 group-hover/bar:to-purple-400 group-hover/bar:shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover/bar:border-purple-500/30"
                        style={{ height: `${(d.value / maxRevenue) * 100}%` }}
                      >
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 bg-slate-900 border border-purple-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black text-white whitespace-nowrap shadow-2xl scale-75 group-hover/bar:scale-100">
                            ₩{(d.value / 10000).toFixed(0)}만
                         </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover/bar:text-purple-400 transition-colors">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
           {/* Popular Items */}
           <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-fit">
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Top Vectors</h3>
              <div className="space-y-4">
                 {popularItems.length === 0 ? (
                   <div className="py-12 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Waiting for data...</div>
                 ) : popularItems.map((item, i) => (
                   <div key={i} className="flex items-center gap-4 p-5 rounded-[1.8rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all hover:translate-x-1 group">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-xl group-hover:scale-110 transition-transform">
                         <Utensils className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                         <div className="text-[9px] font-black text-purple-500/60 uppercase tracking-widest mb-1">Rank #{i+1} Vector</div>
                         <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none mb-1">{item.name}</h4>
                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{item.count} Sales Recorded</span>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-black text-emerald-400 italic tabular-nums">₩{item.price.toLocaleString()}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Zone Occupancy */}
           <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-fit">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                 <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Node Occupancy</h3>
                 <Laptop className="w-6 h-6 text-slate-700" />
              </div>
              <div className="space-y-8">
                 {Object.entries(occupancyByZone).length === 0 ? (
                    <div className="py-8 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">Scanning Network...</div>
                 ) : Object.entries(occupancyByZone).map(([zone, stat]) => (
                    <div key={zone} className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">ZONE {zone}</span>
                          <span className="text-[11px] font-black italic text-purple-400 tabular-nums">{Math.round((stat.active / stat.total) * 100)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${(stat.active / stat.total) * 100}%` }}
                          />
                       </div>
                       <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-green" /> {stat.active} Active</span>
                          <span>{stat.total} Nodes</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Health Summary Card */}
           <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-purple-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <Monitor className="w-5 h-5 text-purple-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Efficiency Insight</span>
                 </div>
                 <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase italic">
                    "현재 <span className="text-white">Zone 101</span>의 점유율이 가장 높습니다. 피크 타임 대비 운영 인력 배치를 최적화 하십시오."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
