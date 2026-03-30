import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, LogIn, Loader2, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBypassing, setIsBypassing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [roomNumber, setRoomNumber] = useState(1);

  // 원격 로그인 바이패스 수신 (데모용)
  useEffect(() => {
    const setupBypassListener = async () => {
      // URL 파라미터에서 room_number 추출 (?room=1), 없으면 기본 1
      const params = new URLSearchParams(window.location.search);
      const roomNum = parseInt(params.get('room') || '1');
      setRoomNumber(roomNum);

      const { data: rooms } = await supabase.from('rooms').select('id').eq('room_number', roomNum);
      const roomData = rooms?.[0];
      if (!roomData) return;

      const channel = supabase
        .channel(`remote-bypass-${roomData.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'remote_commands',
            filter: `room_id=eq.${roomData.id}`
          },
          (payload: any) => {
            if (payload.new.command === 'LOGIN_BYPASS') {
              setIsBypassing(true);
              // 게스트 세션 플래그 설정
              sessionStorage.setItem('isGuestSession', 'true');
              
              setTimeout(() => {
                navigate('/client', { replace: true });
              }, 2000);
            }
          }
        )
        .subscribe();

      return channel;
    };

    let activeChannel: any;
    setupBypassListener().then(ch => { if(ch) activeChannel = ch; });

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        if (session?.user) {
          const isAdminEmail = session.user.email === 'admin@playit.com';
          
          const { data: member } = await supabase
            .from('members')
            .select('is_admin')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (member?.is_admin || isAdminEmail) {
            navigate('/', { replace: true });
          } else {
            navigate('/client', { replace: true });
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        
        alert('회원가입 확인 메일이 발송되었습니다.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Bypass Overlay */}
      {isBypassing && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-500">
           <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-purple-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.5)] animate-bounce">
                 <Zap className="w-10 h-10 text-white fill-current" />
              </div>
              <div className="flex flex-col items-center">
                 <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Remote Unlock Protocol</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-500 mt-2">Bypassing Node Authentication...</p>
              </div>
           </div>
        </div>
      )}
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-700">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-[28px] flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)] mb-6 group transition-transform hover:scale-105 duration-500">
                <Shield className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                Playit <span className="text-purple-500">Platform</span>
            </h1>
            <div className="flex items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Ultimate PC Launcher</p>
                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">STATION {roomNumber}</span>
                </div>
            </div>
        </div>

        {/* Card Section */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="flex gap-1 mb-8">
                <button 
                    onClick={() => setIsLogin(true)}
                    className={cn(
                        "flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-2xl",
                        isLogin ? "bg-white/5 text-white border border-white/10" : "text-slate-600 hover:text-slate-400"
                    )}
                >
                    Identity Login
                </button>
                <button 
                    onClick={() => setIsLogin(false)}
                    className={cn(
                        "flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-2xl",
                        !isLogin ? "bg-white/5 text-white border border-white/10" : "text-slate-600 hover:text-slate-400"
                    )}
                >
                    New Node
                </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors">
                            <LogIn className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="DISPLAY NAME" 
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors">
                        <Mail className="w-4 h-4" />
                    </div>
                    <input 
                        type="email" 
                        placeholder="ACCESS EMAIL" 
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors">
                        <Lock className="w-4 h-4" />
                    </div>
                    <input 
                        type="password" 
                        placeholder="ACCESS KEY" 
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest animate-shake">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-[24px] uppercase tracking-[0.3em] text-xs shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'Establish Connection' : 'Register Node'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>

        <div className="mt-10 text-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em]">
                Secure Access Terminal v5.0.1-DEMO
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
