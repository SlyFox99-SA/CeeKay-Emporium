import { useEffect, useState } from 'react';
import { Plus, Save, MapPin, Phone, Mail, X } from 'lucide-react';
import { getAllStores, updateStore, createStore } from '../../services/storesService';

const EMPTY_STORE = {
  id: '', name: 'CeeKay Emporium', branch: '', address: '', whatsapp: '', email: '',
  hours_label: 'Mon-Sun · 10:00 – 21:00', coming_soon: false
};

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await getAllStores();
      setStores(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (editing.isNew) {
        const { isNew, ...payload } = editing;
        await createStore(payload);
      } else {
        const { isNew, ...payload } = editing;
        await updateStore(editing.id, payload);
      }
      await load();
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <div className="admin-page-eyebrow">Manage</div>
          <h1 className="admin-page-title">Stores</h1>
        </div>
        <button className="admin-btn-primary" onClick={() => setEditing({ ...EMPTY_STORE, isNew: true })}>
          <Plus size={16} /> Add Branch
        </button>
      </header>

      {loading ? <div className="admin-loading-inline">Loading stores…</div> : (
        <div className="admin-table">
          <div className="admin-table-head" style={{ gridTemplateColumns: '1fr 1fr 1fr 100px' }}>
            <div>Branch</div><div>Contact</div><div>Status</div><div></div>
          </div>
          {stores.map(s => (
            <div key={s.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 100px' }}>
              <div>
                <div className="admin-menu-name"><MapPin size={14} /> {s.branch}</div>
                <div className="admin-menu-slug">{s.id}</div>
              </div>
              <div>
                <div className="admin-customer-phone"><Phone size={12} /> {s.whatsapp}</div>
                <div className="admin-customer-phone"><Mail size={12} /> {s.email}</div>
              </div>
              <div>
                <span className={`admin-pill ${s.coming_soon ? 'off' : 'on'}`}>
                  {s.coming_soon ? 'Coming Soon' : 'Open'}
                </span>
                <div style={{fontSize: 11, marginTop: 4, color: '#666'}}>{s.hours_label}</div>
              </div>
              <div className="admin-table-actions">
                <button className="admin-btn-edit" onClick={() => setEditing(s)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <div className="admin-page-eyebrow">{editing.isNew ? 'New Branch' : 'Edit Branch'}</div>
                <h2 className="admin-modal-title">{editing.branch || 'Untitled'}</h2>
              </div>
              <button className="admin-modal-close" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-field">
                  <span className="admin-field-label">Branch Name</span>
                  <input value={editing.branch} onChange={e => setEditing({...editing, branch: e.target.value, id: editing.isNew ? e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') : editing.id})} placeholder="e.g. Springs" />
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">Address</span>
                  <input value={editing.address} onChange={e => setEditing({...editing, address: e.target.value})} placeholder="Springs, Gauteng" />
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">WhatsApp Number</span>
                  <input value={editing.whatsapp} onChange={e => setEditing({...editing, whatsapp: e.target.value})} placeholder="27780000000" />
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">Email</span>
                  <input value={editing.email} onChange={e => setEditing({...editing, email: e.target.value})} placeholder="springs@ceekayemporium.co.za" />
                </label>
                <label className="admin-field admin-field-full">
                  <span className="admin-field-label">Hours Label</span>
                  <input value={editing.hours_label} onChange={e => setEditing({...editing, hours_label: e.target.value})} placeholder="Mon-Sun · 10:00 – 20:00" />
                </label>
              </div>
              
              <div className="admin-form-toggles" style={{ marginTop: 24 }}>
                <label className="admin-check">
                  <input type="checkbox" checked={!!editing.coming_soon} onChange={e => setEditing({...editing, coming_soon: e.target.checked})} />
                  <span>Mark as Coming Soon (disables ordering)</span>
                </label>
              </div>
              {error && <div className="admin-login-error" style={{marginTop: 16}}>{error}</div>}
            </div>

            <div className="admin-modal-foot">
              <button className="admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="admin-btn-primary" onClick={save} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}