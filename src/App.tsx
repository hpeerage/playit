/* src/App.tsx - Main Router with Auth Guard */
import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ClientLauncher from './pages/ClientLauncher';
import LoginPage from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';

// 관리자 전용 가드
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (!isAdmin) {
        // 관리자가 아니면 대시보드 접근 불가 -> 클라이언트로 이동
        console.warn('Access denied: Not an administrator');
        navigate('/client', { replace: true });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Verifying Admin Credentials...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// 인증 보호 가드
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Establishing Secure Link...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};



function App() {
  return (
    <Router>
      <Routes>
        {/* 관리자 대시보드 (관리자만 접근 가능) */}
        <Route 
          path="/" 
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } 
        />
        
        {/* 로그인/회원가입 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 클라이언트 런처 (인증 필수) */}
        <Route 
          path="/client" 
          element={
            <AuthGuard>
              <ClientLauncher />
            </AuthGuard>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
