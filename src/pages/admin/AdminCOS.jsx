import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, ClipboardPaste, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getIngredients, addIngredient, addBulkIngredients, deleteIngredient } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminCOS() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [yieldAmt, setYieldAmt] = useState('');
  const [unit, setUnit] = useState('slice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) { console.error(err); }
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

  // --- SMART PARSER ---
  const parseText = (text) => {
    const lines = text.split('\n');
    const results = [];

    lines.forEach(line => {
      let clean = line.trim();
      if (!clean || clean.toLowerCase().includes('packaging') || clean.toLowerCase().includes('sauce')) return;

      // 1. Extract Price (Look for R followed by numbers, or ranges like 90-100)
      // Matches R100, =R14, R90-100
      const priceMatch = clean.match(/(?:R|=)\s*(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?/i);
      let extractedPrice = 0;
      if (priceMatch) {
        // If there's a range (e.g., 90-100), take the highest number to be safe
        extractedPrice = priceMatch[2] ? parseFloat(priceMatch[2].replace(',', '.')) : parseFloat(priceMatch[1].replace(',', '.'));
      } else {
        // Fallback: just look for the largest number
        const nums = clean.match(/\d+(?:[.,]\d+)?/g);
        if (nums) extractedPrice = Math.max(...nums.map(n => parseFloat(n.replace(',', '.'))));
      }

      // 2. Extract Yield (Look for numbers before x, kg, g, L)
      const yieldMatch = clean.match(/(\d+)\s*(?:x|kg|g|L|pieces|slices)/i);
      let extractedYield = 1;
      let extractedUnit = 'unit';
      
      if (yieldMatch) {
        extractedYield = parseFloat(yieldMatch[1]);
        if (clean.toLowerCase().includes('kg')) extractedUnit = 'kg';
        else if (clean.toLowerCase().includes('g')) extractedUnit = 'g';
        else if (clean.toLowerCase().includes('l')) extractedUnit = 'L';
        else if (clean.toLowerCase().includes('x')) extractedUnit = 'piece';
      }

      // 3. Extract Name (Remove the price/yield strings)
      let extractedName = clean
        .replace(/(?:R|=)\s*\d+(?:[.,]\d+)?/gi, '') // remove R100, =R14
        .replace(/\d+\s*(?:x|kg|g|L)/gi, '') // remove 54x, 10kg
        .replace(/\d+/g, '') // remove any remaining numbers
        .replace(/[=.-]/g, ' ') // remove symbols
        .replace(/\s+/g, ' ') // squish spaces
        .trim();

      if (extractedPrice > 0 && extractedName.length > 2) {
        results.push({
          name: extractedName,
          purchase_price: extractedPrice,
          yield_amount: extractedYield,
          unit: extractedUnit
        });
      }
    });

    return results;
  };

  const handleParse = () => {
    const parsed = parseText(bulkText);
    if (parsed.length === 0) {
      alert("Couldn't find any valid items. Please check the format.");
    } else {
      setParsedPreview(parsed);
    }
  };

  const handleConfirmImport = async () => {
    setIsBulkProcessing(true);
    try {
      await addBulkIngredients(parsedPreview);
      haptics.success();
      setBulkText('');
      setParsedPreview([]);
      await loadData();
    } catch (err) {
      alert(`Failed to import:\n${err.message}`);
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
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Cost of Sales</h1>
      </header>

      {/* SMART BULK PASTE */}
      {!parsedPreview.length ? (
        <div style={{ background: 'linear-gradient(135deg, #1e5f9c, var(--ck-brand-deep))', borderRadius: '24px', padding: '20px', marginBottom: '24px', color: 'white', boxShadow: '0 8px 25px rgba(15,46,74,0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}>
            <ClipboardPaste size={18} /> Smart Paste Notes
          </h3>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 16px', lineHeight: 1.4 }}>
            Paste your raw notes. The AI will decipher prices, yields, and units automatically.
          </p>
          
          <textarea 
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Bread per loaf=R14&#10;Cheese 54x = R100-R125&#10;Potato bag 10kg=R90-100 each"
            style={{ width: '100%', height: '150px', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '14px', fontFamily: 'monospace', outline: 'none', marginBottom: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--ck-ink)' }}
          />

          <button onClick={handleParse} disabled={!bulkText.trim()} style={{ width: '100%', padding: '14px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            Decipher Notes <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* PREVIEW PARSED RESULTS */
        <div style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '2px solid var(--ck-green)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-green)' }}>
            <CheckCircle2 size={18} /> Review Parsed Items
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {parsedPreview.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--ck-cream)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>{item.name}</strong></div>
                <div>R{item.purchase_price} / {item.yield_amount} {item.unit}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setParsedPreview([])} style={{ flex: 1, padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Cancel</button>
            <button onClick={handleConfirmImport} disabled={isBulkProcessing} style={{ flex: 2, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800 }}>
              {isBulkProcessing ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY (Kept for quick single items) */}
      <form onSubmit={handleAdd} style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
          <Calculator size={18} /> Manual Entry
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input type="text" placeholder="Ingredient Name" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="number" step="0.01" placeholder="Bulk Price (R)" value={price} onChange={e => setPrice(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            <input type="number" placeholder="Yield" value={yieldAmt} onChange={e => setYieldAmt(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
          </div>
          <input type="text" placeholder="Unit (slice, loaf, gram)" value={unit} onChange={e => setUnit(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px' }}>
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
              <motion.div key={ing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>Bulk: R{ing.purchase_price} for {ing.yield_amount} {ing.unit}s</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Cost / {ing.unit}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                  </div>
                  <button onClick={() => handleDelete(ing.id)} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}><Trash2 size={16} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}