/* src/hooks/useAuth.ts */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Member } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMemberProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // 프로필이 없는 경우 (새 회원가입 등)
          console.warn('Member profile not found for user:', userId);
        } else {
          throw error;
        }
      }
      setMember(data || null);
      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error fetching member profile:', err);
    }
  }, []);

  useEffect(() => {
    // 1. 초기 세션 확인
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchMemberProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchMemberProfile(session.user.id);
        } else {
          setMember(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Auth state change failed:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMemberProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    member,
    isAdmin,
    loading,
    signOut,
    refreshProfile: () => user && fetchMemberProfile(user.id)
  };
};
