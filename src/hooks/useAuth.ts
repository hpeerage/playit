/* src/hooks/useAuth.ts - Build Fix for Demo */
import { useCallback } from 'react';

export const useAuth = () => {
  // 모든 인증 로직을 무시하고 즉시 데모 관리자 데이터를 반환합니다.
  // 빌드 오류 방지를 위해 미사용 Supabase 호출 로직을 제거했습니다.
  return {
    user: { 
      id: 'demo-admin-uuid', 
      email: 'admin@playit.com',
      user_metadata: { full_name: 'DEMO_ADMIN_USER' }
    } as any,
    member: {
      id: 'demo-member-id',
      user_id: 'demo-admin-uuid',
      name: 'DEMO_ADMIN',
      rank: 'VIP',
      points: 999999,
      remaining_time: '999:59:59',
      is_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any,
    isAdmin: true,
    loading: false,
    signOut: async () => { 
      sessionStorage.clear();
      window.location.hash = '/login'; 
    },
    refreshProfile: useCallback(() => {}, [])
  };
};
