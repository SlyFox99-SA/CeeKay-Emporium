import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, ClipboardPaste, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIngredients, addIngredient, addBulkIngredients, deleteIngredient } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminCOS() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  // Single Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [yieldAmt, setYieldAmt] = useState('');
  const [unit, setUnit] = useState('slice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Paste State
  const [bulkText, setBulkText] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !price || !yieldAmt) return alert('Please fill in all fields');
    
    setIsSubmitting(true);
    haptics.success();
    try {
      await addIngredient({
        name,
        purchase_price: Number(price),
        yield_amount: Number(yieldAmt),
        unit
      });
      setName(''); setPrice(''); setYieldAmt(''); setUnit('slice');
      await loadData();
    } catch (err) {
      alert(`Failed to add ingredient:\n${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkPaste = async () => {
    if (!bulkText.trim()) return;
    setIsBulkProcessing(true);
    
    try {
      // Parse the pasted text
      const lines = bulkText.trim().split('\n');
      const parsedIngredients = [];

      lines.forEach(line => {
        // Expecting format: Name, Price, Yield, Unit
        // e.g., Cheese, 100, 54, slices
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length === 4) {
          const [name, price, yieldAmt, unit] = parts;
          if (name && !isNaN(Number(price)) && !isNaN(Number(yieldAmt))) {
            parsedIngredients.push({
              name,
              purchase_price: Number(price),
              yield_amount: Number(yieldAmt),
              unit
            });
          }
        }
      });

      if (parsedIngredients.length === 0) {
        alert('No valid items found. Make sure format is:\nIngredient Name, Price, Yield, Unit\n(e.g., Cheese, 100, 54, slices)');
      } else {
        await addBulkIngredients(parsedIngredients);
        haptics.success();
        setBulkText('');
        setBulkSuccess(true);
        setTimeout(() => setBulkSuccess(false), 3000);
        await loadData();
      }
    } catch (err) {
      alert(`Failed to process bulk text:\n${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ingredient?')) return;
    haptics.light();
    try {
      await deleteIngredient(id);
      loadData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Cost of Sales</h1>
      </header>

      {/* BULK PASTE FORM */}
      <div style={{ background: 'linear-gradient(135deg, #1e5f9c, var(--ck-brand-deep))', borderRadius: '24px', padding: '20px', marginBottom: '24px', color: 'white', boxShadow: '0 8px 25px rgba(15,46,74,0.2)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>
          <ClipboardPaste size={18} /> Smart Bulk Paste
        </h3>
        <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 16px', lineHeight: 1.4 }}>
          Paste your notes below. Use commas to separate: <br/>
          <strong>Name, Price, Yield, Unit</strong>
        </p>
        
        <textarea 
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Cheese, 100, 54, slices&#10;Bread, 14, 1, loaf&#10;Russian, 50, 10, pieces"
          style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '14px', fontFamily: 'monospace', outline: 'none', marginBottom: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--ck-ink)' }}
        />

        <button 
          onClick={handleBulkPaste}
          disabled={isBulkProcessing || !bulkText.trim()}
          style={{ width: '100%', padding: '14px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isBulkProcessing ? 'Processing...' : bulkSuccess ? <><CheckCircle2 size={18} /> Imported!</> : 'Decipher & Import'}
        </button>
      </div>

      {/* MANUAL FORM */}
      <form onSubmit={handleAdd} style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
          <Calculator size={18} /> Manual Entry
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input 
            type="text" placeholder="Ingredient Name" 
            value={name} onChange={e => setName(e.target.value)} required
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }}
          />
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Bulk Price (R)</label>
              <input type="number" step="0.01" placeholder="100.00" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Yield (How many?)</label>
              <input type="number" placeholder="54" value={yieldAmt} onChange={e => setYieldAmt(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Unit (e.g., slice, loaf, gram)</label>
            <input type="text" placeholder="slice" value={unit} onChange={e => setUnit(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> {isSubmitting ? 'Adding...' : 'Calculate & Save'}
        </button>
      </form>

      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '4px' }}>Ingredient Costs</h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ck-ink-soft)' }}>Loading...</div>
      ) : ingredients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)', background: 'white', borderRadius: '20px', border: '1px dashed var(--ck-border)' }}>
          No ingredients added yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ingredients.map(ing => {
            const costPerUnit = (ing.purchase_price / ing.yield_amount);
            return (
              <motion.div 
                key={ing.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>
                    Bulk: R{ing.purchase_price} for {ing.yield_amount} {ing.unit}s
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Cost / {ing.unit}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                  </div>
                  <button onClick={() => handleDelete(ing.id)} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}