import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ClientLauncher from './pages/ClientLauncher';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 관리자 대시보드 (바이패스 적용) */}
        <Route path="/" element={<AdminDashboard />} />
        
        {/* 로그인 페이지 (바이패스 시 실질적으로 불필요하지만 유지) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 클라이언트 런처 (바이패스 적용) */}
        <Route path="/client" element={<ClientLauncher />} />
      </Routes>
    </Router>
  );
}

export default App;
