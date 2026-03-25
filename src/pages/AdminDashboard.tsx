import { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import GNB from '../components/GNB';
import RoomCard from '../components/RoomCard';
import DetailPanel from '../components/DetailPanel';
import MemberListView from '../components/admin/MemberListView';
import OrderQueueView from '../components/admin/OrderQueueView';
import SeatMapView from '../components/admin/SeatMapView';
import ReportsView from '../components/admin/ReportsView';
import { useRooms } from '../hooks/useRooms';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, ShoppingBag, Monitor, BarChart3, Shield, Settings, Bell, Grid, Map as MapIcon, X } from 'lucide-react';

const AdminDashboard = () => {
  const { rooms, stats, loading, updateRoomStatus, checkoutRoom } = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingOrders, setPendingOrders] = useState(3);
  const [filter, setFilter] = useState('All');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

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

  // Simulate real-time order updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingOrders(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : Math.random() > 0.8 ? -1 : 0)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time notifications from Supabase
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  
  useEffect(() => {
    // 1. 초기 미확인 알림 로드
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifications();

    // 2. 실시간 알림 구독
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        
        // 브라우저 알림 (선택 사항)
        if (Notification.permission === 'granted') {
          new Notification('New Playit Alert', { body: payload.new.message });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch recent notifications (History)
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
  
  const dismissAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    const ids = notifications.map(n => n.id);
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    setNotifications([]);
  };

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId) || null, 
    [rooms, selectedRoomId]
  );

  const dashStats = useMemo(() => ({
    ...stats,
    pendingOrders
  }), [stats, pendingOrders]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'pcstatus', icon: Monitor, label: 'PC Status' },
    { id: 'inventory', icon: Shield, label: 'Security' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Group rooms by Floor and then by Room
  const floorGroups = useMemo(() => {
    if (!filteredRooms || filteredRooms.length === 0) return {};
    
    return filteredRooms.reduce((acc, room) => {
      // Safety check for zone parsing
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

    if (filteredRooms.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-10">
            <Shield className="w-16 h-16 text-slate-800" />
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">No Units Detected</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">
              The monitoring system is active but no PC units are currently connected to the network. Please verify database synchronization.
            </p>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'members':
        return <MemberListView />;
      case 'orders':
        return <OrderQueueView />;
      case 'reports':
        return <ReportsView />;
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
                    {/* View Switcher */}
                    <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'grid' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          <Grid className="w-3.5 h-3.5" /> Room View
                        </button>
                        <button 
                          onClick={() => setViewMode('map')}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'map' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          <MapIcon className="w-3.5 h-3.5" /> Map
                        </button>
                    </div>

                    <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 h-fit">
                        {['All', 'Active', 'Empty', 'Error'].map((f) => (
                          <button 
                            key={f} 
                            onClick={() => setFilter(f)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              f === filter ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                    </div>
                 </div>
              </div>

              <div className={cn(
                "px-10 transition-all duration-700",
                selectedRoomId ? "pr-[420px]" : "pr-10"
              )}>
                {viewMode === 'grid' ? (
                  Object.entries(floorGroups).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([floor, rooms]) => (
                    <div key={floor} className="floor-section">
                      <div className="floor-label">
                         <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                         <span className="floor-label-text">{floor}F Floor</span>
                         <div className="flex-1 h-px bg-white/5" />
                      </div>
                      
                      <div className="rooms-grid">
                        {Object.entries(rooms).sort(([a], [b]) => a.localeCompare(b)).map(([zone, zoneRooms]) => (
                          <div key={zone} className="room-box">
                             <div className="room-header">
                                <span className="room-title">
                                   <Shield className="w-3 h-3 text-purple-500/50" />
                                   Room {zone}
                                </span>
                                <div className="flex gap-1">
                                   <div className="w-1 h-1 rounded-full bg-slate-700" />
                                   <div className="w-1 h-1 rounded-full bg-slate-700" />
                                </div>
                             </div>
                             <div className="room-pc-grid">
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
                  <SeatMapView 
                    rooms={filteredRooms}
                    selectedRoomId={selectedRoomId}
                    onRoomClick={(id) => setSelectedRoomId(id)}
                  />
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
        <Header 
          stats={dashStats} 
          currentTime={currentTime} 
          unreadCount={notifications.length}
          onBellClick={() => setIsHistoryOpen(!isHistoryOpen)}
        />

        <main className="flex-1 flex overflow-hidden relative">
          {renderMainContent()}

          {activeMenu === 'dashboard' || activeMenu === 'pcstatus' ? (
            <DetailPanel 
              room={selectedRoom}
              onClose={() => setSelectedRoomId(null)}
              onStatusChange={updateRoomStatus}
              onCheckout={checkoutRoom}
            />
          ) : null}
        </main>

        <footer className="h-8 bg-[#020617] border-t border-white/5 flex items-center px-8 justify-between shrink-0">
           <div className="flex items-center gap-6">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 grow-green" />
                 Database Node Connected
              </span>
           </div>
           <div className="flex items-center gap-4 text-[9px] font-bold text-slate-700 uppercase italic">
              Terminal AZ-01-SECURE
           </div>
        </footer>
      </div>

      {/* Notification Center (Right Sidebar) */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-[400px] bg-slate-950 border-l border-white/5 z-[3000] shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform",
        isHistoryOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
           <div className="h-[70px] px-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                 <Bell className="w-5 h-5 text-purple-500" />
                 <h2 className="text-lg font-black italic text-white uppercase tracking-tighter">Notification Center</h2>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {recentNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                   <Bell className="w-12 h-12" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Alert History</span>
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 group/item relative",
                      n.is_read 
                        ? "bg-slate-900/30 border-white/5 opacity-60" 
                        : "bg-purple-500/5 border-purple-500/20 shadow-[0_10px_30px_rgba(139,92,246,0.05)]"
                    )}
                  >
                    {!n.is_read && (
                      <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    )}
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            n.type === 'Call' ? "text-red-400" : "text-amber-400"
                          )}>
                            {n.type || 'Alert'} Message
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 tabular-nums">
                            {new Date(n.created_at).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       <p className="text-sm font-bold text-slate-300 leading-relaxed pr-8">
                         {n.message}
                       </p>
                       <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          {!n.is_read && (
                            <button 
                              onClick={() => dismissNotification(n.id)}
                              className="text-[9px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300"
                            >
                              Mark as Read
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>

           {notifications.length > 0 && (
             <div className="p-6 border-t border-white/5 bg-slate-900/20">
                <button 
                  onClick={dismissAllNotifications}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  Mark All as Read
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Admin Notifications Overlay */}
      <div className="fixed bottom-12 right-6 z-[2000] flex flex-col gap-3 pointer-events-none items-end">
        {notifications.length > 1 && (
          <button 
            onClick={dismissAllNotifications}
            className="pointer-events-auto mb-2 flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-xl group"
          >
            <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
            Clear All Notifications
          </button>
        )}

        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border-l-4 border-l-red-500 border border-white/5 p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-in slide-in-from-right duration-500 w-[320px] relative group/card">
            <button 
              onClick={() => dismissNotification(n.id)}
              className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/0 hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all opacity-0 group-hover/card:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <Bell className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black italic text-white uppercase tracking-tighter">Admin Call Received</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed uppercase pr-6">{n.message}</p>
                <button 
                  onClick={() => dismissNotification(n.id)}
                  className="mt-2 text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors"
                >
                  Dismiss Call
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
