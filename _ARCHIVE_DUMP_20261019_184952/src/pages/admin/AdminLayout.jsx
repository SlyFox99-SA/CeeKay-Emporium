import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Utensils, Receipt, LogOut, ShoppingCart, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../config/features';

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/admin/login');
  };

  const navLinks = [
    { to: "/admin", icon: Home, label: "Dashboard", end: true },
    { to: "/admin/menu", icon: Utensils, label: "Menu" },
    { to: "/admin/pos", icon: ShoppingCart, label: "Cashier POS", show: FEATURES.enablePOS },
    { to: "/admin/orders", icon: Receipt, label: "Orders" },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: '32px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-brand-deep)', letterSpacing: '-0.02em' }}>CeeKay</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 800, color: 'var(--ck-warm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Console</p>
        </div>
        
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navLinks.map((link) => {
            if (link.show === false) return null;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
                <link.icon size={18} /> {link.label}
              </NavLink>
            );
          })}

          {FEATURES.enableKitchenLink && (
            <button onClick={() => navigate('/kitchen')} className="admin-nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
              <Flame size={18} /> Kitchen Display
            </button>
          )}
        </nav>

        <div style={{ padding: '24px 16px' }}>
          <button onClick={handleLogout} className="admin-nav-item" style={{ color: 'var(--ck-achaar-red)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}><Outlet /></div>
      </main>
    </div>
  );
}