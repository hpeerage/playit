import { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import GNB from '../components/GNB';
import RoomCard from '../components/RoomCard';
import DetailPanel from '../components/DetailPanel';
import MemberListView from '../components/admin/MemberListView';
import OrderQueueView from '../components/admin/OrderQueueView';
import SeatMapView from '../components/admin/SeatMapView';
import ReportsView from '../components/admin/ReportsView';
import ProductManagementView from '../components/admin/ProductManagementView';
import { useRooms } from '../hooks/useRooms';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, ShoppingBag, Monitor, BarChart3, Settings, Bell, Grid, Map as MapIcon, X, Package } from 'lucide-react';

const AdminDashboard = () => {
  const { rooms, stats, loading, updateRoomStatus, checkoutRoom, sendRemoteCommand } = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState('All');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: string, created_at: string, is_read: boolean}[]>([]);

  // Header와 호환되는 stats 변환
  const headerStats = useMemo(() => ({
    total: stats.totalRooms,
    using: stats.activeRooms,
    empty: stats.emptyRooms,
    pendingOrders: notifications.length
  }), [stats, notifications.length]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    if (filter === 'All') return rooms;
    if (filter === 'Active') return rooms.filter(r => r.status === 'Using');
    if (filter === 'Empty') return rooms.filter(r => r.status === 'Empty');
    if (filter === 'Error') return rooms.filter(r => r.status === 'Maintenance');
    return rooms;
  }, [rooms, filter]);

  // Real-time notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifications();

    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification('New Playit Alert', { body: payload.new.message });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRecentNotifications(data);
  };

  useEffect(() => {
    if (isHistoryOpen) {
      fetchRecentNotifications();
    }
  }, [isHistoryOpen, notifications]);

  const dismissNotification = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId) || null, 
    [rooms, selectedRoomId]
  );

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'pcstatus', icon: Monitor, label: 'PC Status' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const floorGroups = useMemo(() => {
    if (!filteredRooms || filteredRooms.length === 0) return {};
    return filteredRooms.reduce((acc, room) => {
      const zoneStr = room.zone || "101";
      const roomNum = parseInt(zoneStr);
      const floor = isNaN(roomNum) ? 1 : Math.floor(roomNum / 100);
      const zone = zoneStr;
      if (!acc[floor]) acc[floor] = {};
      if (!acc[floor][zone]) acc[floor][zone] = [];
      acc[floor][zone].push(room);
      return acc;
    }, {} as Record<number, Record<string, typeof filteredRooms>>);
  }, [filteredRooms]);

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Data...</span>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'members': return <MemberListView />;
      case 'orders': return <OrderQueueView />;
      case 'reports': return <ReportsView />;
      case 'inventory': return <ProductManagementView />;
      case 'dashboard':
      case 'pcstatus':
      default:
        return (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-700 pb-20">
              <div className="mb-8 mt-8 flex items-center justify-between px-10">
                 <div>
                    <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Store Layout Monitoring</h2>
                    <div className="flex items-center gap-3">
                       <span className="text-2xl font-black italic text-white leading-none uppercase tracking-tighter">Real-Time Floor View</span>
                       <div className="h-4 w-px bg-white/10" />
                       <span className="text-purple-400 text-[11px] font-bold uppercase tracking-widest">{filteredRooms.length} Units Connected</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-6">
                    <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                        <button onClick={() => setViewMode('grid')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'grid' ? "bg-purple-600 text-white" : "text-slate-500")}>
                          <Grid className="w-3.5 h-3.5" /> Room View
                        </button>
                        <button onClick={() => setViewMode('map')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'map' ? "bg-purple-600 text-white" : "text-slate-500")}>
                          <MapIcon className="w-3.5 h-3.5" /> Map
                        </button>
                    </div>

                    <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 h-fit">
                        {['All', 'Active', 'Empty', 'Error'].map((f) => (
                          <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", f === filter ? "bg-slate-800 text-white" : "text-slate-500")}>
                            {f}
                          </button>
                        ))}
                    </div>
                 </div>
              </div>

              <div className={cn("px-10 transition-all duration-700", selectedRoomId ? "pr-[420px]" : "pr-10")}>
                {viewMode === 'grid' ? (
                  Object.entries(floorGroups).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([floor, rooms]) => (
                    <div key={floor} className="floor-section">
                      <div className="floor-label flex items-center gap-3 mb-6">
                         <div className="w-2 h-2 rounded-full bg-purple-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{floor}F Floor</span>
                         <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {Object.entries(rooms).map(([zone, zoneRooms]) => (
                          <div key={zone} className="space-y-4 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                             <div className="flex items-center justify-between px-2 mb-2">
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-50" />
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Zone {zone} Node</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-700 italic">{zoneRooms.length} Units</span>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                {zoneRooms.map((room) => (
                                  <RoomCard
                                    key={room.id}
                                    roomNumber={room.room_number}
                                    status={room.status}
                                    remainingTime="02:30:00"
                                    isSelected={selectedRoomId === room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                  />
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <SeatMapView rooms={filteredRooms} selectedRoomId={selectedRoomId} onRoomClick={setSelectedRoomId} />
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden select-none relative font-sans">
      <GNB activeMenu={activeMenu} setActiveMenu={setActiveMenu} items={navItems} />

      <div className="flex-1 flex flex-col min-w-0 ml-[80px] relative transition-all duration-500">
        <Header stats={headerStats} currentTime={currentTime} unreadCount={notifications.length} onBellClick={() => setIsHistoryOpen(!isHistoryOpen)} />

        <main className="flex-1 flex overflow-hidden relative">
          {renderMainContent()}
          <DetailPanel 
            room={selectedRoom} 
            onClose={() => setSelectedRoomId(null)} 
            onStatusChange={updateRoomStatus} 
            onCheckout={checkoutRoom}
            onRemoteCommand={sendRemoteCommand}
          />
        </main>

        <footer className="h-8 bg-[#020617] border-t border-white/5 flex items-center px-8 justify-between shrink-0">
           <div className="flex items-center gap-6">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 grow-green" />
                 Database Node Connected
              </span>
           </div>
           <div className="flex items-center gap-4 text-[9px] font-bold text-slate-700 uppercase italic">Terminal AZ-01-SECURE</div>
        </footer>
      </div>

      {/* Notification Center */}
      <div className={cn("fixed inset-y-0 right-0 w-[400px] bg-slate-950 border-l border-white/5 z-[3000] shadow-2xl transition-all duration-500", isHistoryOpen ? "translate-x-0" : "translate-x-full")}>
        <div className="flex flex-col h-full">
           <div className="h-[70px] px-8 flex items-center justify-between border-b border-white/5">
              <h2 className="text-lg font-black italic text-white uppercase tracking-tighter">Notifications</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {recentNotifications.map((n) => (
                <div key={n.id} className={cn("p-4 rounded-xl border", n.is_read ? "opacity-50" : "bg-purple-500/5 border-purple-500/20")}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase text-purple-400">{n.type}</span>
                    <button onClick={() => dismissNotification(n.id)} className="text-[8px] text-slate-500 hover:text-white uppercase font-black">Dismiss</button>
                  </div>
                  <p className="text-xs font-bold text-slate-300">{n.message}</p>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Admin Notifications Overlay */}
      <div className="fixed bottom-12 right-6 z-[2000] flex flex-col gap-3 items-end">
        {notifications.map((n) => (
          <div key={n.id} className="bg-slate-900/95 border-l-4 border-l-red-500 p-4 rounded-xl shadow-2xl w-[320px] animate-in slide-in-from-right">
             <div className="flex gap-3">
                <Bell className="w-5 h-5 text-red-500" />
                <div>
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest">New Alert</h4>
                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{n.message}</p>
                   <button onClick={() => dismissNotification(n.id)} className="mt-2 text-[8px] font-black text-red-400 uppercase">Dismiss</button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
