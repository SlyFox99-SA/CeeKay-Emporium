import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: 'white' }}>Authenticating…</div>;

  // If not logged in, send to login
  if (!user) return <Navigate to="/admin/login" replace />;

  // If they need admin access but don't have it
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // If they need kitchen access but don't have it (must be kitchen or admin)
  if (!requireAdmin && profile?.role !== 'kitchen' && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}