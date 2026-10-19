import { useEffect, useState } from 'react';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { getAllMenu, deleteMenuItem, getModifiers, updateItemModifiers } from '../../services/menuService';
import MobileMenuModal from '../../components/mobile/MobileMenuModal';
import { motion, AnimatePresence } from 'framer-motion';

// HARDCODED SVGS to guarantee rendering
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const SkeletonRow = () => (
  <motion.div 
    animate={{ opacity: [0.5, 1, 0.5] }} 
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', marginBottom: '12px' }}
  >
    <div>
      <div style={{ width: '120px', height: '16px', background: 'var(--ck-cream)', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ width: '80px', height: '12px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
    </div>
    <div style={{ width: '80px', height: '32px', background: 'var(--ck-cream)', borderRadius: '8px' }} />
  </motion.div>
);

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  
  const [editingModsFor, setEditingModsFor] = useState(null);
  const [selectedModIds, setSelectedModIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [menuData, modData] = await Promise.all([getAllMenu(), getModifiers()]);
    setItems(menuData || []);
    setModifiers(modData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteMenuItem(deleteTarget.id);
    setDeleteTarget(null);
    setIsDeleting(false);
    loadData();
  };

  const openModEditor = (item) => {
    setEditingModsFor(item);
    setSelectedModIds([]); 
  };

  const toggleModSelection = (id) => {
    setSelectedModIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const saveMods = async () => {
    await updateItemModifiers(editingModsFor.id, selectedModIds);
    setEditingModsFor(null);
    loadData();
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Menu</h1>
        </div>
        <button 
          onClick={() => setModalItem({})}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ck-brand-deep)', color: 'white', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}
        >
          <Plus size={18} /> Add Item
        </button>
      </header>

      {loading ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => (
            <div 
              key={item.id} 
              style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-ink)' }}>{item.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>{item.category} • R {Number(item.price).toFixed(2)}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {item.category === 'kota' && (
                  <button onClick={() => openModEditor(item)} style={{ padding: '8px 12px', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--ck-brand-deep)', fontWeight: 700, fontSize: '12px' }}>
                    Add-ons
                  </button>
                )}
                
                {/* EDIT BUTTON WITH HARDCODED SVG */}
                <button 
                  onClick={() => setModalItem(item)} 
                  style={{ width: '36px', height: '36px', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ck-brand-deep)' }}
                >
                  <EditIcon />
                </button>

                {/* DELETE BUTTON WITH HARDCODED SVG */}
                <button 
                  onClick={() => setDeleteTarget(item)} 
                  style={{ width: '36px', height: '36px', background: 'rgba(229, 57, 53, 0.1)', border: '1px solid rgba(229, 57, 53, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ck-achaar-red)' }}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalItem !== null && (
        <MobileMenuModal item={modalItem} onClose={() => setModalItem(null)} onSave={() => { loadData(); setModalItem(null); }} />
      )}

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.1)', color: 'var(--ck-achaar-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>Delete {deleteTarget.name}?</h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--ck-ink-soft)', lineHeight: 1.4 }}>This action cannot be undone. This item will be permanently removed from your menu.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={handleDelete} disabled={isDeleting} style={{ width: '100%', padding: '14px', background: 'var(--ck-achaar-red)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Item'}
                </button>
                <button onClick={() => setDeleteTarget(null)} style={{ width: '100%', padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}