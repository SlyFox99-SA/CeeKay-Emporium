/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Shield, ChefHat, Calculator, User as UserIcon, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  const load = async () => {
    setLoading(true);
    try {
      // STRICT: Only fetch explicitly defined staff roles
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'pos', 'kitchen'])
        .order('created_at', { ascending: false });
        
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
    if (role === 'admin') return <Shield size={14} color="var(--ck-brand-deep)" />;
    if (role === 'kitchen') return <ChefHat size={14} color="var(--ck-warm)" />;
    if (role === 'pos') return <Calculator size={14} color="var(--ck-green)" />;
    return <UserIcon size={14} color="var(--ck-ink-soft)" />;
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Super Admin';
    if (role === 'kitchen') return 'Cook';
    if (role === 'pos') return 'Cashier';
    return 'Staff';
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {staff.map(user => (
            <div 
              key={user.id} 
              style={{ 
                background: 'white', borderRadius: '20px', padding: '16px', 
                border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                display: 'flex', flexDirection: 'column', gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--ck-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={22} color="var(--ck-brand-deep)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-ink)' }}>{user.full_name || 'No Name'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ck-cream)', padding: '6px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, color: 'var(--ck-ink)' }}>
                  {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--ck-border)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginBottom: '8px', textTransform: 'uppercase' }}>Assign Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  
                  <button 
                    onClick={() => updateRole(user.id, 'pos')}
                    style={{ padding: '12px 8px', borderRadius: '12px', border: 'none', background: user.role === 'pos' ? 'var(--ck-brand-deep)' : 'var(--ck-cream)', color: user.role === 'pos' ? 'white' : 'var(--ck-ink)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Calculator size={18} /> Cashier
                  </button>

                  <button 
                    onClick={() => updateRole(user.id, 'kitchen')}
                    style={{ padding: '12px 8px', borderRadius: '12px', border: 'none', background: user.role === 'kitchen' ? 'var(--ck-brand-deep)' : 'var(--ck-cream)', color: user.role === 'kitchen' ? 'white' : 'var(--ck-ink)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <ChefHat size={18} /> Cook
                  </button>

                  <button 
                    onClick={() => updateRole(user.id, 'admin')}
                    style={{ padding: '12px 8px', borderRadius: '12px', border: 'none', background: user.role === 'admin' ? 'var(--ck-brand-deep)' : 'var(--ck-cream)', color: user.role === 'admin' ? 'white' : 'var(--ck-ink)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <Shield size={18} /> Admin
                  </button>

                </div>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>No staff members found. Promote a customer to staff in Supabase.</div>
          )}
        </div>
      )}
    </div>
  );
}
