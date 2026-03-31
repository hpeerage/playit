import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type DeliveryOrder } from './useDeliveryOrder';

export const useClientDeliveryTracker = (roomId: string | null) => {
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // 1. Initial fetch (가장 최근의 완료/취소되지 않은 주문 1건)
    const fetchActiveOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('room_id', roomId)
          .in('status', ['Pending', 'Delivering', 'Completed']) // 최근 Completed도 잠시 보여줄 수 있도록
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = NO ROW
          console.error(error);
          return;
        }

        if (data) {
           // Completed된지 3분이 지났다면 무시
           if (data.status === 'Completed') {
              const diffMs = new Date().getTime() - new Date(data.updated_at).getTime();
              if (diffMs < 3 * 60 * 1000) {
                 setActiveOrder(data as any);
              }
           } else {
             setActiveOrder(data as any);
           }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchActiveOrder();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`client-delivery-tracker-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE
          schema: 'public',
          table: 'delivery_orders',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          // 상태가 변경되었을 때 실시간 반영
          if (payload.new) {
             const newOrder = payload.new as DeliveryOrder;
             if (newOrder.status === 'Cancelled') {
               setActiveOrder(null);
             } else {
               setActiveOrder(newOrder);
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const clearActiveOrder = () => setActiveOrder(null);

  return { activeOrder, clearActiveOrder };
};
