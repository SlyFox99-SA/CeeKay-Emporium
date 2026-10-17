import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Receipt, Store, Users, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CKMark from '../../components/CKMark';

const NAV = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/admin/menu',   icon: Utensils,        label: 'Menu' },
  { to: '/admin/orders', icon: Receipt,         label: 'Orders' },
  { to: '/admin/stores', icon: Store,           label: 'Stores' },
  { to: '/admin/staff',  icon: Users,           label: 'Staff' },
];

export default function AdminLayout() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-head">
            <span className="admin-login-mark"><CKMark size={44} /></span>
            <h1 className="admin-login-title">No admin access</h1>
            <p className="admin-login-sub">Signed in as <strong>{profile?.email || user?.email}</strong>.</p>
          </div>
          <button className="admin-login-submit" onClick={signOut} style={{ marginTop: 24 }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <CKMark size={28} />
          <div>
            <div className="admin-sidebar-name">CeeKay</div>
            <div className="admin-sidebar-role">Back office</div>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer" className="admin-nav-item">
            <ExternalLink size={16} />
            <span>View store</span>
          </a>
          <button className="admin-nav-item" onClick={signOut}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}