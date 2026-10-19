import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Utensils, Receipt, Store, Users, LogOut, ShoppingCart, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../config/features';

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ck-cream)' }}>
      <aside style={{ width: '260px', background: 'white', borderRight: '1px solid var(--ck-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-brand-deep)' }}>CeeKay</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Admin Panel</p>
        </div>
        
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink to="/admin" end style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', background: isActive ? 'var(--ck-cream)' : 'transparent', color: isActive ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)' })}>
            <Home size={18} /> Dashboard
          </NavLink>
          
          <NavLink to="/admin/menu" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', background: isActive ? 'var(--ck-cream)' : 'transparent', color: isActive ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)' })}>
            <Utensils size={18} /> Menu
          </NavLink>

          {FEATURES.enablePOS && (
            <NavLink to="/admin/pos" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', background: isActive ? 'var(--ck-cream)' : 'transparent', color: isActive ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)' })}>
              <ShoppingCart size={18} /> Cashier POS
            </NavLink>
          )}

          <NavLink to="/admin/orders" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', background: isActive ? 'var(--ck-cream)' : 'transparent', color: isActive ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)' })}>
            <Receipt size={18} /> Orders
          </NavLink>

          {FEATURES.enableKitchenLink && (
            <button onClick={() => navigate('/kitchen')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: 'var(--ck-ink-soft)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <Flame size={18} /> Kitchen Display
            </button>
          )}
        </nav>

        <div style={{ padding: '24px' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'transparent', border: 'none', color: 'var(--ck-achaar-red)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}><Outlet /></div>
      </main>
    </div>
  );
}