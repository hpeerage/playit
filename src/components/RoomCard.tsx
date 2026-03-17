/* src/components/RoomCard.tsx */
import React from 'react';
import { Monitor, AlertCircle, User, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import type { RoomStatus } from '../lib/supabase';

interface RoomCardProps {
  roomNumber: string;
  status: RoomStatus;
  remainingTime?: string;
  isSelected?: boolean;
  onClick: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  roomNumber, 
  status, 
  remainingTime, 
  isSelected, 
  onClick 
}) => {
  const isUsing = status === 'USING';
  const isError = status === 'MAINTENANCE';
  const isEmpty = status === 'EMPTY' || status === 'CLEANING';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "room-card-square group",
        isUsing && "room-card-using",
        isError && "animate-blink-red",
        isSelected && "ring-2 ring-white ring-inset border-white"
      )}
    >
      {/* Room Number */}
      <span className={cn(
        "text-xs font-bold mb-1",
        isUsing ? "text-white" : "text-slate-400"
      )}>
        {roomNumber}
      </span>

      {/* Status Icon */}
      <div className="mb-1">
        {isUsing ? (
          <User className="w-5 h-5 text-white" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-white" />
        ) : (
          <Monitor className="w-4 h-4 text-slate-600 group-hover:text-purple-400" />
        )}
      </div>

      {/* Remaining Time */}
      <div className="flex items-center gap-1">
        {isUsing && (
          <>
            <Clock className="w-3 h-3 text-white/70" />
            <span className="text-[10px] font-medium text-white">
              {remainingTime || "02:45"}
            </span>
          </>
        )}
        {isEmpty && (
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
            Empty
          </span>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
