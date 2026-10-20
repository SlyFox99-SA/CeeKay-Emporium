import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIngredients, deleteIngredient } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';
import AddCOSModal from '../../components/mobile/AddCOSModal';

export default function AdminCOS() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const haptics = useHaptics();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this ingredient?')) return;
    haptics.light();
    try {
      await deleteIngredient(id);
      loadData();
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Cost of Sales</h1>
      </header>

      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
        Current Ingredients ({ingredients.length})
      </h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>Loading...</div>
      ) : ingredients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)', background: 'white', borderRadius: '20px', border: '1px dashed var(--ck-border)' }}>
          No ingredients added yet.<br/>Tap the + button to start.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {ingredients.map(ing => {
              const costPerUnit = (ing.purchase_price / ing.yield_amount);
              return (
                <motion.div 
                  key={ing.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ background: 'white', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</h4>
                    <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>R{ing.purchase_price} for {ing.yield_amount} {ing.unit}s</div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', background: 'var(--ck-cream)', padding: '8px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Cost / {ing.unit}</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                    </div>
                    <button onClick={() => handleDelete(ing.id)} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        style={{ 
          position: 'fixed', bottom: '90px', right: '20px', 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'var(--ck-brand-deep)', color: 'white', border: 'none', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: '0 8px 25px rgba(15,46,74,0.3)', cursor: 'pointer', zIndex: 90 
        }}
      >
        <Plus size={32} />
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <AddCOSModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => { setIsModalOpen(false); loadData(); }} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}