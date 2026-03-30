/* src/hooks/useRooms.ts - Build Fix for Demo */
import type { Room } from '../lib/supabase';

export const useRooms = () => {
  // 데모 시연을 위해 즉시 가상 데이터를 반환하며, 
  // 빌드 오류 방지를 위해 미사용 상태 변수들을 정리합니다.
  const demoRooms: Room[] = Array.from({ length: 48 }, (_, i) => ({
    id: `room-${i + 1}`,
    room_number: i + 1,
    status: i % 7 === 0 ? 'Using' : 'Empty',
    zone: (101 + Math.floor(i / 4)).toString(),
    remaining_time: '02:30:00',
    current_user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  return {
    rooms: demoRooms,
    stats: {
      totalRooms: 48,
      activeRooms: demoRooms.filter(r => r.status === 'Using').length,
      emptyRooms: demoRooms.filter(r => r.status === 'Empty').length,
      maintenanceRooms: 0
    },
    loading: false,
    error: null,
    updateRoomStatus: async () => {},
    checkoutRoom: async () => {},
    sendRemoteCommand: async () => {},
    refreshRooms: () => {}
  };
};
