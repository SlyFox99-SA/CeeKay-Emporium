import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Utensils, Receipt, LogOut, ShoppingCart, Flame, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CKMark from '../../components/CKMark';
import { FEATURES } from '../../config/features';

export default function MobileAdminShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/admin/login');
  };

  return (
    <div className="mobile-app-shell">
      
      {/* Top Bar */}
      <header className="mobile-topbar" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '18px', color: 'var(--ck-ink)' }}>
          <CKMark size={26} />
          <span>Admin</span>
        </div>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--ck-achaar-red)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="m-main-content">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(64px + env(safe-area-inset-bottom))', background: 'white', borderTop: '1px solid var(--ck-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.04)' }}>
        <NavLink to="/admin" end style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? 'var(--ck-brand-deep)' : '#999', fontSize: '10px', fontWeight: 700, textDecoration: 'none' })}>
          <Home size={20} strokeWidth={2} />
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/admin/menu" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? 'var(--ck-brand-deep)' : '#999', fontSize: '10px', fontWeight: 700, textDecoration:'none' })}>
          <Utensils size={20} strokeWidth={2} />
          <span>Menu</span>
        </NavLink>

        {FEATURES.enablePOS && (
          <NavLink to="/admin/pos" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? 'var(--ck-brand-deep)' : '#999', fontSize: '10px', fontWeight: 700, textDecoration: 'none' })}>
            <ShoppingCart size={20} strokeWidth={2} />
            <span>POS</span>
          </NavLink>
        )}

        <NavLink to="/admin/orders" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? 'var(--ck-brand-deep)' : '#999', fontSize: '10px', fontWeight: 700, textDecoration: 'none' })}>
          <Receipt size={20} strokeWidth={2} />
          <span>Orders</span>
        </NavLink>

        {/* NEW: Stores Link */}
        <NavLink to="/admin/stores" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isActive ? 'var(--ck-brand-deep)' : '#999', fontSize: '10px', fontWeight: 700, textDecoration: 'none' })}>
          <Store size={20} strokeWidth={2} />
          <span>Stores</span>
        </NavLink>

        {FEATURES.enableKitchenLink && (
          <button onClick={() => navigate('/kitchen')} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#999', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
            <Flame size={20} strokeWidth={2} />
            <span>Kitchen</span>
          </button>
        )}
      </nav>
    </div>
  );
}