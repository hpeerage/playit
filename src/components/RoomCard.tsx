/* src/components/RoomCard.tsx */
import React from 'react';
import { Monitor, User, LogIn, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import type { RoomStatus } from '../lib/supabase';

interface RoomCardProps {
  roomNumber: string;
  status: RoomStatus;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ roomNumber, status, onCheckIn, onCheckOut }) => {
  const isUsing = status === 'USING';

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
      isUsing 
        ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/20" 
        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
    )}>
      {/* Background Accent */}
      {isUsing && (
        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold tracking-tight">{roomNumber}호</h3>
        <div className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-semibold",
          isUsing ? "bg-primary text-white" : "bg-zinc-800 text-zinc-400"
        )}>
          {isUsing ? '사용중' : '공실'}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3 text-zinc-400">
          <Monitor className={cn("w-5 h-5", isUsing ? "text-primary" : "text-zinc-600")} />
          <span className="text-sm">PC 상태: {isUsing ? '가동 중' : '꺼짐'}</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <User className={cn("w-5 h-5", isUsing ? "text-primary" : "text-zinc-600")} />
          <span className="text-sm">고객: {isUsing ? '이** 고객님' : '-'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {!isUsing ? (
          <button
            onClick={onCheckIn}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" />
            가상 체크인
          </button>
        ) : (
          <button
            onClick={onCheckOut}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            체크아웃
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
