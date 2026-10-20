import { useEffect, useState } from 'react';
import { Users, Shield, ChefHat, User as UserIcon, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setStaff(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    haptics.success();
    await supabase.from('profiles').update({ role }).eq('id', id);
    load();
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield size={16} color="var(--ck-brand-deep)" />;
    if (role === 'kitchen') return <ChefHat size={16} color="var(--ck-warm)" />;
    if (role === 'pos') return <Calculator size={16} color="var(--ck-green)" />;
    return <UserIcon size={16} color="var(--ck-ink-soft)" />;
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Staff & Roles</h1>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>Loading staff...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staff.map(user => (
            <div 
              key={user.id} 
              style={{ 
                background: 'white', borderRadius: '16px', padding: '16px', 
                border: '1px solid var(--ck-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--ck-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={20} color="var(--ck-brand-deep)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)' }}>{user.full_name || 'No Name'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--ck-cream)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'capitalize' }}>
                  {getRoleIcon(user.role)} {user.role}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--ck-border)', paddingTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Assign Role</label>
                <select 
                  value={user.role || 'customer'} 
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '14px', fontWeight: 600, outline: 'none', background: 'white' }}
                >
                  <option value="customer">Customer (App Only)</option>
                  <option value="pos">Cashier (POS Only)</option>
                  <option value="kitchen">Cook (Kitchen Only)</option>
                  <option value="admin">Super Admin (Full Access)</option>
                </select>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>No staff profiles found.</div>
          )}
        </div>
      )}
    </div>
  );
}