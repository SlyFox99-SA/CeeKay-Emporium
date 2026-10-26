/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Plus, Save, MapPin, Phone, Mail, X, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllStores, updateStore, createStore, deleteStore } from '../../services/storesService';
import { useHaptics } from '../../hooks/useHaptics';
import { openGoogleMaps } from '../../lib/mapsUtils';

const EMPTY_STORE = {
  id: '', 
  name: 'CeeKay Emporium', 
  branch: '', 
  address: '', 
  whatsapp: '', 
  email: '',
  hours_label: 'Mon-Sun | 10:00 - 21:00', 
  coming_soon: false,
  maps_link: ''
};

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const haptics = useHaptics();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllStores();
      setStores(data); 
    } catch (e) {
      setError(e.message || 'Failed to load stores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    haptics.medium();
    try {
      if (editing.isNew) {
        const { isNew, ...payload } = editing;
        await createStore(payload);
      } else {
        const { isNew, ...payload } = editing;
        await updateStore(editing.id, payload);
      }
      haptics.success();
      await load();
      setEditing(null);
    } catch (e) {
      setError(e.message || 'Failed to save store.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError('');
    haptics.medium();
    
    // Safety timeout: If Supabase hangs, force clear the UI after 5 seconds
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout. Forcing local delete.')), 5000)
    );

    try {
      // Race the real delete against the timeout
      await Promise.race([deleteStore(deleteTarget.id), timeout]);
      haptics.success();
    } catch (e) {
      console.warn(e.message);
      if (e.message.includes('timeout')) {
         setError('Database hung, but store was removed from UI. Please refresh later.');
      } else {
         setError(e.message || 'Failed to delete store.');
         haptics.error();
      }
    } finally {
      // ALWAYS remove from UI and close modal, regardless of database success/hang
      setDeleteTarget(null);
      setStores(prev => prev.filter(s => s.id !== deleteTarget.id));
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-page" style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)', overflowX: 'hidden' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Stores</h1>
        </div>
        <button 
          onClick={() => { haptics.light(); setEditing({ ...EMPTY_STORE, isNew: true }); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ck-brand-deep)', color: 'white', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}
        >
          <Plus size={18} /> Add
        </button>
      </header>

      {error && (
        <div style={{ background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', padding: '16px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>Loading stores...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stores.map(s => (
            <div key={s.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid var(--ck-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--ck-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="var(--ck-brand-deep)" /> {s.branch}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)', fontFamily: 'monospace' }}>{s.id}</div>
                </div>
                <span style={{ background: s.coming_soon ? 'var(--ck-cream)' : 'rgba(76, 175, 80, 0.1)', color: s.coming_soon ? 'var(--ck-ink-soft)' : 'var(--ck-green)', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800 }}>
                  {s.coming_soon ? 'Coming Soon' : 'Open'}
                </span>
              </div>

              <div style={{ background: 'var(--ck-cream)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ck-ink-soft)' }}><Phone size={14} /> {s.whatsapp}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ck-ink-soft)' }}><Mail size={14} /> {s.email}</div>
                {(s.maps_link || s.address) && (
                  <button 
                    onClick={() => openGoogleMaps(s)}
                    style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'rgba(66, 133, 244, 0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#4285F4', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <MapPin size={16} /> View on Google Maps
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => { haptics.light(); setEditing(s); }}
                  style={{ flex: 1, padding: '12px', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--ck-brand-deep)', fontWeight: 700, fontSize: '13px' }}
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => { haptics.light(); setDeleteTarget(s); }}
                  style={{ padding: '12px', background: 'rgba(229, 57, 53, 0.1)', border: '1px solid rgba(229, 57, 53, 0.2)', borderRadius: '8px', cursor: 'pointer', color: '#E53935' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {stores.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ck-ink-soft)' }}>No stores found. Click 'Add' to create one.</div>}
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }} />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 9999, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--ck-border)' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--ck-font-serif)', fontSize: '22px', color: 'var(--ck-ink)' }}>{editing.isNew ? 'New Branch' : 'Edit Branch'}</h2>
                <button onClick={() => setEditing(null)} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ padding: '24px', overflowY: 'auto' }}>
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Branch Name</span>
                  <input value={editing.branch || ''} onChange={e => setEditing({...editing, branch: e.target.value})} placeholder="e.g. Springs" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>

                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Address</span>
                  <input value={editing.address || ''} onChange={e => setEditing({...editing, address: e.target.value})} placeholder="Full address" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>

                {/* GOOGLE MAPS LINK FIELD */}
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Google Maps Link</span>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ck-ink-soft)' }} />
                    <input 
                      value={editing.maps_link || ''} 
                      onChange={e => setEditing({...editing, maps_link: e.target.value})} 
                      placeholder="https://maps.app.goo.gl/..." 
                      style={{ width: '100%', padding: '14px 14px 14px 42px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)', marginTop: '6px' }}>Open Google Maps, find your store, click Share, and paste the link here.</div>
                </label>

                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>WhatsApp Number</span>
                  <input value={editing.whatsapp || ''} onChange={e => setEditing({...editing, whatsapp: e.target.value})} placeholder="27780000000" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>

                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Email</span>
                  <input value={editing.email || ''} onChange={e => setEditing({...editing, email: e.target.value})} placeholder="branch@ceekay.com" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!editing.coming_soon} onChange={e => setEditing({...editing, coming_soon: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--ck-brand-deep)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Mark as Coming Soon</span>
                </label>
              </div>

              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--ck-border)', display: 'flex', gap: '12px' }}>
                <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '16px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ flex: 2, padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>Delete {deleteTarget.branch}?</h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--ck-ink-soft)' }}>This will permanently remove the branch from the system.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={handleDelete} disabled={isDeleting} style={{ width: '100%', padding: '14px', background: '#E53935', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Branch'}
                </button>
                <button onClick={() => setDeleteTarget(null)} style={{ width: '100%', padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
