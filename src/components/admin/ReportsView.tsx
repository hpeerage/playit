/* src/components/admin/ReportsView.tsx */
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Download, 
  Utensils, 
  ArrowUpRight,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const ReportsView = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [revenueFilter, setRevenueFilter] = useState<'Today' | 'Week' | 'Month' | 'All'>('Week');
  const [occupancyByZone, setOccupancyByZone] = useState<Record<string, { total: number, active: number }>>({});
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'Completed')
          .order('created_at', { ascending: true });

        if (allOrders) {
          const now = new Date();
          let filtered = allOrders;

          if (revenueFilter === 'Today') {
            filtered = allOrders.filter(o => new Date(o.created_at).toDateString() === now.toDateString());
          } else if (revenueFilter === 'Week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = allOrders.filter(o => new Date(o.created_at) >= weekAgo);
          } else if (revenueFilter === 'Month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = allOrders.filter(o => new Date(o.created_at) >= monthAgo);
          }

          setTotalRevenue(filtered.reduce((sum, o) => sum + (o.total_price || 0), 0));
          setTotalOrders(filtered.length);

          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
          });

          const trendMap = new Map();
          last7Days.forEach(day => trendMap.set(day, 0));

          allOrders.forEach(order => {
            const dayKey = new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            if (trendMap.has(dayKey)) {
              trendMap.set(dayKey, trendMap.get(dayKey) + order.total_price);
            }
          });

          setRevenueData(Array.from(trendMap).map(([name, value]) => ({ name, value })));

          const itemMap: Record<string, {count: number, price: number, name: string}> = {};
          allOrders.forEach(order => {
            const items = order.order_items as any[];
            if (Array.isArray(items)) {
              items.forEach(item => {
                const existing = itemMap[item.name] || { count: 0, price: item.price, name: item.name };
                itemMap[item.name] = { ...existing, count: existing.count + (item.count || 1) };
              });
            }
          });
          const sortedItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);
          setPopularItems(sortedItems);
        }

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
  }, [revenueFilter]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black text-white italic tracking-tighter">
            ₩{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar bg-[#020617] animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Systems Analysis Console</h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">Operational Intelligence</span>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
              {['Today', 'Week', 'Month', 'All'].map(f => (
                <button 
                  key={f}
                  onClick={() => setRevenueFilter(f as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    revenueFilter === f ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-slate-500 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center gap-2 transition-all">
            <Download className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Export PDF</span>
          </button>
          <button className="h-12 px-6 bg-purple-600 hover:bg-purple-500 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-purple-900/20">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] group-hover:bg-purple-600/10 transition-all duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Gross Terminal Revenue</h3>
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-5xl font-black italic text-white tracking-tighter tabular-nums mb-4">
                  ₩{totalRevenue.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                  <ArrowUpRight className="w-3 h-3" /> +14.2% <span className="text-slate-600 ml-1">since last session</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] group-hover:bg-blue-600/10 transition-all duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Order Throughput</h3>
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="text-5xl font-black italic text-white tracking-tighter tabular-nums mb-4">
                   {totalOrders.toLocaleString()} <span className="text-lg text-slate-600 not-italic">units</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Real-time network active
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[50px] shadow-2xl h-[450px]">
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-10">Velocity Performance</h3>
            <div className="w-full h-full pb-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} 
                    dy={13}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] shadow-2xl h-fit">
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Top Profit Vectors</h3>
            <div className="h-[250px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularItems} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {popularItems.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {popularItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-white/5 text-purple-400 group-hover:scale-110 transition-transform">
                      <Utensils className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white uppercase italic tracking-tighter truncate">{item.name}</h4>
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.count} Sales</div>
                   </div>
                   <span className="text-[10px] font-black text-emerald-400 italic">₩{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Terminal Load</h3>
               <Target className="w-5 h-5 text-slate-700" />
            </div>
            <div className="space-y-6">
              {Object.entries(occupancyByZone).map(([zone, stat]) => (
                <div key={zone} className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ZONE {zone}</span>
                    <span className="text-xs font-black text-white italic">{Math.round((stat.active / stat.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-1000"
                      style={{ width: `${(stat.active / stat.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
