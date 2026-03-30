/* src/components/admin/OrderQueueView.tsx */
import { ShoppingCart, CheckCircle2, Clock, XCircle, ChevronRight, User, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrders } from '../../hooks/useOrders';

const OrderQueueView = () => {
  const { orders, loading, error, updateOrderStatus, cancelOrder } = useOrders();

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
        <p className="text-lg font-bold">Failed to load orders</p>
        <p className="text-sm opacity-60">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Live Order Queue</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pending Requests: {orders.filter(o => o.status === 'Pending').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className={cn(
            "bg-slate-900/30 border rounded-2xl p-5 transition-all hover:shadow-2xl group relative overflow-hidden",
            order.status === 'Pending' ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]" :
            order.status === 'Processing' ? "border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.05)]" :
            "border-white/5 opacity-60"
          )}>
            {/* Status Indicator */}
            <div className={cn(
              "absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl",
              order.status === 'Pending' ? "bg-amber-500 text-slate-950" :
              order.status === 'Processing' ? "bg-blue-500 text-white" :
              order.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
            )}>
              {order.status}
            </div>

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950/50 flex flex-col items-center justify-center border border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase">ST</span>
                  <span className="text-lg font-black text-white italic tabular-nums">
                    {/* room_id에서 실제 room_number를 가져오려면 추가 Join 조회가 필요하지만 여기서는 ID 뒷부분 표시 */}
                    {order.room_id.slice(-2)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                    {order.id.split('-')[0]} <ChevronRight className="w-3 h-3 text-slate-600" />
                  </h4>
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      {order.member_id ? 'MEMBER' : 'GUEST'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/30 rounded-xl p-4 mb-6 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Order Items</span>
              </div>
              <div className="space-y-1">
                {(order.items as any[] || []).map((item: any, idx: number) => (
                  <p key={idx} className="text-xs font-bold text-slate-300 leading-relaxed uppercase">
                    {item.name} x{item.count}
                  </p>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Total Amount</span>
                <span className="text-sm font-black italic text-emerald-400 tabular-nums lowercase first-letter:uppercase">
                  ₩{order.total_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            {(order.status === 'Pending' || order.status === 'Processing') && (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => updateOrderStatus(order.id, order.status === 'Pending' ? 'Processing' : 'Completed')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20",
                    order.status === 'Pending' ? "bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-slate-950" : 
                    "bg-blue-600 border border-blue-500 text-white hover:bg-blue-500"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" /> 
                  {order.status === 'Pending' ? 'Set Processing' : 'Set Completed'}
                </button>
                <button 
                  onClick={() => cancelOrder(order.id)}
                  className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center group/cancel"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="max-w-0 overflow-hidden group-hover/cancel:max-w-xs group-hover/cancel:ml-2 text-[8px] font-black uppercase transition-all duration-300">Refund</span>
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-4 px-1">
              <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-800" /> Received: {new Date(order.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
            No active orders in queue
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderQueueView;
