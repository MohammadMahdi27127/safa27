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
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

/**
 * ✅ HomeGate: Validates token before routing
 * - Checks token expiration
 * - Validates user session
 * - Redirects to appropriate dashboard or login
 */
function HomeGate() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // ✅ Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0c071e',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(168, 85, 247, 0.2)',
            borderTop: '4px solid #a855f7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
            درحال بارگذاری...
          </span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ✅ Authenticated - redirect to appropriate dashboard
  if (isAuthenticated && user) {
    return <Navigate to={user.is_manager ? '/manager' : '/dashboard'} replace />;
  }

  // ✅ Not authenticated - show landing page
  return <LandingPage />;
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;