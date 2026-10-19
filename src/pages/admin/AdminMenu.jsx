import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { getAllMenu, deleteMenuItem, getModifiers, updateItemModifiers } from '../../services/menuService';
import MobileMenuModal from '../../components/mobile/MobileMenuModal';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div style={{ width: '40px', height: '40px', background: 'var(--ck-cream)', borderRadius: '8px' }} />
  </motion.div>
);

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  
  const [editingModsFor, setEditingModsFor] = useState(null);
  const [selectedModIds, setSelectedModIds] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const [menuData, modData] = await Promise.all([getAllMenu(), getModifiers()]);
    setItems(menuData || []);
    setModifiers(modData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMenuItem(id);
      loadData();
    }
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
    <div style={{ padding: '24px 20px' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Menu</h1>
        </div>
        <button 
          onClick={() => setModalItem({})}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ck-brand-deep)', color: 'white', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          <Plus size={16} /> Add
        </button>
      </header>

      {loading ? (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
          {items.map(item => (
            <motion.div 
              key={item.id} 
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)', marginBottom: '12px' }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--ck-ink)' }}>{item.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>{item.category} • R {Number(item.price).toFixed(2)}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {item.category === 'kota' && (
                  <button onClick={() => openModEditor(item)} style={{ padding: '10px', background: 'var(--ck-cream)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--ck-brand-deep)', fontWeight: 600, fontSize: '12px' }}>
                    Add-ons
                  </button>
                )}
                <button onClick={() => setModalItem(item)} style={{ padding: '10px', background: 'var(--ck-cream)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Edit2 size={16} color="var(--ck-ink-soft)" />
                </button>
                <button onClick={() => handleDelete(item.id, item.name)} style={{ padding: '10px', background: 'var(--ck-cream)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Trash2 size={16} color="var(--ck-achaar-red)" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {modalItem !== null && (
        <MobileMenuModal item={modalItem} onClose={() => setModalItem(null)} onSave={() => { loadData(); setModalItem(null); }} />
      )}

      <AnimatePresence>
        {editingModsFor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingModsFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 9999, maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>Manage Add-ons</h2>
              <p style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', marginBottom: '20px' }}>Select which extras are available for <strong>{editingModsFor.name}</strong>.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {modifiers.map(mod => {
                  const isSelected = selectedModIds.includes(mod.id);
                  return (
                    <button key={mod.id} onClick={() => toggleModSelection(mod.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', border: `1px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-cream)' : 'white', cursor: 'pointer' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ck-ink)', fontSize: '13px' }}>{mod.name}</span>
                      {isSelected && <Check size={16} color="var(--ck-brand-deep)" />}
                    </button>
                  );
                })}
              </div>

              <button onClick={saveMods} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 700, border: 'none' }}>
                Save Add-ons
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}