import { useEffect, useState } from 'react';
import { Truck, CheckCircle, ShoppingBag, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useClientDeliveryTracker } from '../../hooks/useClientDeliveryTracker';

interface DeliveryTrackerWidgetProps {
  roomId: string | null;
}

const DeliveryTrackerWidget = ({ roomId }: DeliveryTrackerWidgetProps) => {
  const { activeOrder, clearActiveOrder } = useClientDeliveryTracker(roomId);
  const [isVisible, setIsVisible] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (activeOrder) {
      setIsVisible(true);
      if (activeOrder.status === 'Completed') {
        setJustCompleted(true);
        // 완료된 후 10초 뒤 자동 닫기
        const timer = setTimeout(() => {
          setIsVisible(false);
          clearActiveOrder();
        }, 10000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [activeOrder]);

  if (!isVisible || !activeOrder) return null;

  return (
    <div className={cn(
      "fixed bottom-24 right-8 z-50 w-80 animate-in slide-in-from-right-8 fade-in duration-500",
      justCompleted && "animate-bounce"
    )}>
      <div className={cn(
        "rounded-[24px] overflow-hidden border shadow-2xl backdrop-blur-xl relative p-5 transition-all",
        activeOrder.status === 'Pending' && "bg-slate-900/90 border-white/10",
        activeOrder.status === 'Delivering' && "bg-amber-500/90 border-amber-400 text-slate-950",
        activeOrder.status === 'Completed' && "bg-emerald-500/90 border-emerald-400 text-white"
      )}>
        {/* Close Button */}
        {activeOrder.status === 'Completed' && (
          <button 
            onClick={() => {
              setIsVisible(false);
              clearActiveOrder();
            }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}

        <div className="flex items-start gap-4">
           {/* Icon Box */}
           <div className={cn(
             "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
             activeOrder.status === 'Pending' && "bg-white/10 text-white",
             activeOrder.status === 'Delivering' && "bg-white/20 text-slate-950 animate-pulse",
             activeOrder.status === 'Completed' && "bg-white/20 text-white"
           )}>
             {activeOrder.status === 'Pending' && <ShoppingBag className="w-6 h-6" />}
             {activeOrder.status === 'Delivering' && <Truck className="w-6 h-6" />}
             {activeOrder.status === 'Completed' && <CheckCircle className="w-6 h-6" />}
           </div>

           {/* Content */}
           <div className="flex-1 mt-1">
             <h4 className={cn(
               "font-black text-lg leading-tight tracking-tight mb-1",
               activeOrder.status === 'Pending' ? "text-white" : "text-current"
             )}>
                {activeOrder.status === 'Pending' && "주문 접수 완료"}
                {activeOrder.status === 'Delivering' && "음식 준비/배달 중!"}
                {activeOrder.status === 'Completed' && "배달 완료!"}
             </h4>
             <p className={cn(
               "text-xs font-bold opacity-80",
               activeOrder.status === 'Pending' ? "text-slate-400" : "text-current"
             )}>
               {activeOrder.status === 'Pending' && "제휴 업체에서 곧 확인합니다."}
               {activeOrder.status === 'Delivering' && "주문이 확인되어 처리중입니다."}
               {activeOrder.status === 'Completed' && "자리에 도착했습니다. 맛있게 드세요!"}
             </p>
           </div>
        </div>

        {/* Amount & Time Details */}
        <div className={cn(
          "mt-4 pt-3 border-t text-xs font-bold flex justify-between",
          activeOrder.status === 'Pending' ? "border-white/10 text-slate-500" : "border-black/10 opacity-90"
        )}>
          <span>결제 금액: {activeOrder.total_amount.toLocaleString()}원</span>
          <span>{new Date(activeOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackerWidget;
