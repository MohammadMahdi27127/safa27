import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GrowthPage } from './pages/GrowthPage';
import { ProfilePage } from './pages/ProfilePage';
import { WorkgroupPage } from "./pages/WorkgroupPage";
import { ResolutionOfficerPage } from "./pages/ResolutionOfficerPage";
import { ManagerPage } from "./pages/ManagerPage";
import { FormManagerPage } from "./pages/FormManagerPage";
import { ProtectedRoute } from './components/ProtectedRoute';

function HomeGate() {
  const token = localStorage.getItem('access_token');
  const savedUser = localStorage.getItem('user_info');
  if (token && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      return <Navigate to={user?.is_manager ? '/manager' : '/dashboard'} replace />;
    } catch {
      return <LandingPage />;
    }
  }
  return <LandingPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/growth" element={<ProtectedRoute><GrowthPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/workgroup" element={<ProtectedRoute><WorkgroupPage /></ProtectedRoute>} />
        <Route path="/resolution-officer" element={<ProtectedRoute><ResolutionOfficerPage /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute><ManagerPage /></ProtectedRoute>} />
        <Route path="/form-manager" element={<ProtectedRoute><FormManagerPage /></ProtectedRoute>} />

        <Route path="/" element={<HomeGate />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;