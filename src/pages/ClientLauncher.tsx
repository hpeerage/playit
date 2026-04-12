/* src/pages/ClientLauncher.tsx */
import { useState, useEffect, useRef } from 'react';
import { Gamepad2, ShoppingBag, Headset, User, Bell, Truck } from 'lucide-react';
import ClientHeader from '../components/client/ClientHeader';
import LauncherCard from '../components/client/LauncherCard';
import GameListModal from '../components/client/GameListModal';
import FoodOrderModal from '../components/client/FoodOrderModal';
import MyInfoModal from '../components/client/MyInfoModal';
import DeliveryOrderModal from '../components/client/DeliveryOrderModal';
import DeliveryTrackerWidget from '../components/client/DeliveryTrackerWidget';
import FAQModal from '../components/client/FAQModal';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import ChatWidget from '../components/client/ChatWidget';
import SpaceBackground from '../components/client/SpaceBackground';

const ClientLauncher = () => {
  const { user, member } = useAuth();
  const isGuest = sessionStorage.getItem('isGuestSession') === 'true';
  const displayMember = (member || (isGuest ? {
    id: '614fa574-a8e4-400c-b15a-15e7d3360e0b',
    user_id: '614fa574-a8e4-400c-b15a-15e7d3360e0b',
    name: 'DEMO_USER',
    remaining_time: '36000',
    points: 1250,
    rank: 'Silver',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } : null)) as any;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastConfig, setToastConfig] = useState<{title: string, message: string} | null>(null);
  
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  const { formattedTime, timeLeft, isExpired } = useTimer(displayMember?.remaining_time || null);
  const warningShownRef = useRef({ fiveMin: false, tenMin: false });

  // 실시간 주문 상태 감지
  useEffect(() => {
    if (!user && !isGuest) return;

    const channel = supabase
      .channel(`user-orders-${user?.id || 'guest'}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        (payload: any) => {
          if (payload.new.status === 'Completed' && payload.old.status !== 'Completed') {
            setToastConfig({
              title: 'ORDER COMPLETED',
              message: '주문하신 음식이 준비되었습니다. 곧 조리대에서 가져다 드릴게요!'
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isGuest]);

  // 실시간 배달 주문 상태 감지
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-delivery-orders-${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'delivery_orders',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          if (payload.new.status === 'Completed' && payload.old.status !== 'Completed') {
            setToastConfig({
              title: 'DELIVERY COMPLETED',
              message: '배달 음식이 도착했습니다! 문 앞을 확인해주세요.'
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 8000);
          } else if (payload.new.status === 'Delivering' && payload.old.status !== 'Delivering') {
            setToastConfig({
              title: 'DELIVERY STARTED',
              message: '주문하신 음식이 배달을 시작했습니다.'
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 저시간 경고 및 자동 로그아웃 (WBS 104)
  useEffect(() => {
    if (!user && !isGuest) return;

    /* 
    // 데모 버전을 위해 자동 로그아웃 기능 일시 중지 (향후 재활성화 필요)
    if (isExpired && timeLeft === 0) {
      setToastConfig({
        title: 'SESSION EXPIRED',
        message: '남은 시간이 모두 소진되었습니다. 3초 후 로그아웃됩니다.'
      });
      setShowToast(true);
      setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/login';
      }, 3000);
      return;
    }
    */

    // 10분 경고 (600초)
    if (timeLeft <= 600 && timeLeft > 590 && !warningShownRef.current.tenMin) {
      setToastConfig({
        title: 'TIME WARNING',
        message: '남은 시간이 10분 미만입니다. 충전이 필요하신지 확인해주세요!'
      });
      setShowToast(true);
      warningShownRef.current.tenMin = true;
      setTimeout(() => setShowToast(false), 8000);
    }

    // 5분 경고 (300초)
    if (timeLeft <= 300 && timeLeft > 290 && !warningShownRef.current.fiveMin) {
      setToastConfig({
        title: 'TIME CRITICAL',
        message: '남은 시간이 5분 미만입니다. 곧 세션이 종료됩니다.'
      });
      setShowToast(true);
      warningShownRef.current.fiveMin = true;
      setTimeout(() => setShowToast(false), 8000);
    }
  }, [timeLeft, isExpired, user, isGuest]);

  // 원격 명령 구독 (WBS 3단계)
  useEffect(() => {
    if (!user && !isGuest) return;

    const setupCommandSubscription = async () => {
      const { data: roomData } = await supabase.from('rooms').select('id').eq('room_number', 1011).single();
      if (!roomData) return;
      setRoomId(roomData.id);


      const channel = supabase
        .channel(`remote-ctrl-${roomData.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'remote_commands',
            filter: `room_id=eq.${roomData.id}`
          },
          async (payload: any) => {
            const { command, payload: cmdPayload, id: cmdId } = payload.new;
            
            /* 
            // 데모 시연을 위해 관리자 원격 로그아웃 명령도 일시 수신 거부합니다.
            if (command === 'LOGOUT') {
              setToastConfig({
                title: 'TERMINAL TERMINATED',
                message: '관리자에 의해 세션이 종료되었습니다. 잠시 후 로그아웃됩니다.'
              });
              setShowToast(true);
              setTimeout(() => {
                sessionStorage.removeItem('isGuestSession');
                supabase.auth.signOut();
                window.location.href = '/login';
              }, 3000);
            } else 
            */
            if (command === 'MESSAGE') {
              setToastConfig({
                title: 'ADMIN MESSAGE',
                message: cmdPayload.message || '관리자로부터 메시지가 도착했습니다.'
              });
              setShowToast(true);
              setTimeout(() => setShowToast(false), 8000);
            }

            await supabase.from('remote_commands').update({ is_executed: true }).eq('id', cmdId);
          }
        )
        .subscribe();

      return channel;
    };

    let activeChannel: any;
    setupCommandSubscription().then(ch => { if(ch) activeChannel = ch; });

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [user, isGuest]);

  const handleCallAdmin = async () => {
    try {
      setToastConfig({
        title: 'Request Sent',
        message: 'An admin has been notified.'
      });
      setShowToast(true);
      
      const { data: rooms } = await supabase.from('rooms').select('id').eq('room_number', 1011).single();
      
      await supabase.from('notifications').insert({
        type: 'CALL', // 대문자로 통일
        message: `${displayMember?.name || 'GUEST'}(ID: ${user?.email?.split('@')[0] || 'guest'})님이 Station 1011에서 관리자를 호출했습니다.`,
        room_id: rooms?.id,
        is_read: false
      });

      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Call Admin failed:', error);
    }
  };
  
  const menuItems = [
    { 
      title: "GAME START", 
      description: "EXPLORE THE LATEST TITLES", 
      icon: Gamepad2, 
      color: "bg-fuchsia-600", 
      onClick: () => setIsGameModalOpen(true) 
    },
    { 
      title: "ORDER FOOD", 
      description: "PREMIUM CUISINE AT YOUR SERVICE", 
      icon: ShoppingBag, 
      color: "bg-blue-600", 
      onClick: () => setIsFoodModalOpen(true) 
    },
    { 
      title: "CALL ADMIN", 
      description: "24/7 TERMINAL SUPPORT", 
      icon: Headset, 
      color: "bg-emerald-600", 
      onClick: () => setIsFaqModalOpen(true) 
    },
    { 
      title: "MY INFO", 
      description: "ACCOUNT STATUS & CREDITS", 
      icon: User, 
      color: "bg-orange-600",
      onClick: () => setIsInfoModalOpen(true)
    },
    { 
      title: "DELIVERY ORDER", 
      description: "EXTERNAL DELIVERY SERVICES", 
      icon: Truck,
      color: "bg-purple-600",
      onClick: () => setIsDeliveryModalOpen(true)
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden relative font-sans">
      {/* High-Quality Milky Way Background */}
      <SpaceBackground />
      
      {/* Layered Content */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <ClientHeader />

        <main className="flex-1 flex flex-col justify-center px-10 py-6 overflow-hidden">
          <div className="mb-6 px-2">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500/60 mb-1 block">Authentication Node Connected</span>
             <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
               {displayMember?.name ? `WELCOME, ${displayMember.name}` : 'Ready to Play?'}
             </h2>
          </div>

          <div className="flex gap-8 pb-10 px-2 overflow-x-auto custom-scrollbar relative z-10 w-full max-w-[1600px] mx-auto scroll-smooth py-4">
            {menuItems.map((item, index) => (
              <LauncherCard 
                key={index}
                title={item.title}
                description={item.description}
                icon={item.icon}
                color={item.color}
                onClick={item.onClick}
              />
            ))}
          </div>

          {/* Footer Promo Section */}
          <div className="mt-4 px-2 flex items-center justify-between border-t border-white/5 pt-10">
             <div className="flex items-center gap-10">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Identity</span>
                   <span className="text-sm font-bold text-white uppercase italic tracking-tighter">
                     {displayMember?.rank || 'SILVER'} LEVEL [{(displayMember?.points || 0).toLocaleString()} PT]
                   </span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terminal Session</span>
                   <span className="text-sm font-bold text-slate-400 uppercase italic tabular-nums tracking-tighter">
                     {formattedTime} LEFT
                   </span>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System v1.0.0</span>
                <div className="px-6 py-2 bg-purple-600 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse cursor-pointer hover:bg-purple-500 transition-colors">
                   Support Available
                </div>
             </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <GameListModal isOpen={isGameModalOpen} onClose={() => setIsGameModalOpen(false)} />
      <FoodOrderModal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} />
      <MyInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <DeliveryOrderModal 
        isOpen={isDeliveryModalOpen} 
        onClose={() => setIsDeliveryModalOpen(false)} 
        roomId={roomId} 
        roomNumber={1011} 
      />
      <FAQModal 
        isOpen={isFaqModalOpen} 
        onClose={() => setIsFaqModalOpen(false)} 
        onRequestCall={handleCallAdmin} 
      />

      <DeliveryTrackerWidget roomId={roomId} />
      <ChatWidget roomId={roomId} member={displayMember} />

      {/* Modern Notification Toast */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out",
        showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        <div className="bg-slate-950/90 backdrop-blur-xl border border-purple-500/30 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(139,92,246,0.3)]">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center animate-bounce shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black italic text-white uppercase tracking-tighter">
              {toastConfig?.title || 'Notification'}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {toastConfig?.message || 'New update available.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLauncher;
