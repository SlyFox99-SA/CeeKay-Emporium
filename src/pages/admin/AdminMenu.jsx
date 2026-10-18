import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getAllMenu, deleteMenuItem } from '../../services/menuService';
import MobileMenuModal from '../../components/mobile/MobileMenuModal';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);

  const loadMenu = async () => {
    setLoading(true);
    const data = await getAllMenu();
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { loadMenu(); }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMenuItem(id);
      loadMenu();
    }
  };

  return (
    <div style={{ padding: '24px 20px 0 20px' }}>
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

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--ck-ink)' }}>{item.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>{item.category} • R {Number(item.price).toFixed(2)}</p>
                <span style={{ fontSize: '11px', color: item.available ? 'var(--ck-green)' : 'var(--ck-achaar-red)', fontWeight: 700 }}>
                  {item.available ? 'Available' : 'Sold Out'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setModalItem(item)} style={{ padding: '10px', background: 'var(--ck-cream)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Edit2 size={16} color="var(--ck-ink-soft)" />
                </button>
                <button onClick={() => handleDelete(item.id, item.name)} style={{ padding: '10px', background: 'var(--ck-cream)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  <Trash2 size={16} color="var(--ck-achaar-red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalItem !== null && (
        <MobileMenuModal item={modalItem} onClose={() => setModalItem(null)} onSave={() => { loadMenu(); setModalItem(null); }} />
      )}
    </div>
  );
}