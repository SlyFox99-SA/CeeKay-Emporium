import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Utensils, Receipt, Store, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import PwaInstallBanner from '../../components/mobile/PwaInstallBanner';
import NetworkStatus from '../../components/NetworkStatus';

const NAV = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/admin/menu',   icon: Utensils,        label: 'Menu' },
  { to: '/admin/orders', icon: Receipt,         label: 'Orders' },
  { to: '/admin/stores', icon: Store,           label: 'Stores' },
  { to: '/admin/staff',  icon: Users,           label: 'Staff' },
];

export default function MobileAdminShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loadingâ€¦</div>;
  if (!user) return null;

  return (
    <div className="m-admin-shell">
      <header className="m-admin-header">
        <div className="m-admin-title">CeeKay Admin</div>
        <button className="m-admin-signout" onClick={signOut}>Sign out</button>
      </header>

      <main className="m-admin-content">
        <Outlet />
      </main>

      <NetworkStatus />
      <PwaInstallBanner />
      <nav className="m-admin-nav">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `m-admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}