import { useEffect, useState } from 'react';
import { Users, Shield, ChefHat, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    load();
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <div className="admin-page-eyebrow">Manage</div>
          <h1 className="admin-page-title">Staff & Roles</h1>
        </div>
      </header>

      {loading ? <div className="admin-loading-inline">Loading staff…</div> : (
        <div className="admin-table">
          <div className="admin-table-head" style={{ gridTemplateColumns: '1fr 200px' }}>
            <div>User</div><div>Role</div>
          </div>
          {staff.map(u => (
            <div key={u.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 200px' }}>
              <div>
                <div className="admin-menu-name">{u.full_name || 'No Name'}</div>
                <div className="admin-menu-slug">{u.email}</div>
              </div>
              <div>
                <select
                  className="admin-field"
                  style={{ padding: '8px', minHeight: 'auto', width: '100%' }}
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}