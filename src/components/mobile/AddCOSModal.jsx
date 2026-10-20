import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardPaste, Calculator, ArrowRight, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { addIngredient, addBulkIngredients } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AddCOSModal({ onClose, onSuccess }) {
  const haptics = useHaptics();
  const [mode, setMode] = useState('bulk'); // 'bulk' or 'manual'
  const [loading, setLoading] = useState(false);

  // Manual State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [yieldAmt, setYieldAmt] = useState('');
  const [unit, setUnit] = useState('slice');

  // Bulk State
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isParsed, setIsParsed] = useState(false);

  // --- SMART PARSER V3 ---
  const parseText = () => {
    const lines = bulkText.split('\n');
    const results = [];

    lines.forEach(line => {
      let clean = line.trim();
      if (!clean || ['packaging boxes', 'polystyrene packaging', 'sauce\'s'].includes(clean.toLowerCase())) return;

      let extractedPrice = 0;
      let extractedYield = 1;
      let extractedUnit = 'unit';

      // Look for prices (R100, R100-R125, =R14)
      const priceMatch = clean.match(/(?:R|=)\s*(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?/gi);
      if (priceMatch) {
        const lastMatch = priceMatch[priceMatch.length - 1];
        const nums = lastMatch.match(/\d+(?:[.,]\d+)?/g);
        if (nums) extractedPrice = Math.max(...nums.map(n => parseFloat(n.replace(',', '.'))));
      } else {
        const nums = clean.match(/\d+(?:[.,]\d+)?/g);
        if (nums) extractedPrice = Math.max(...nums.map(n => parseFloat(n.replace(',', '.'))));
      }
      if (extractedPrice === 0) return;

      // Specific overrides based on your notes
      if (clean.includes('Cheese 54x')) { extractedYield = 54; extractedUnit = 'slice'; }
      else if (clean.includes('Butter 1kgx2')) { extractedYield = 2; extractedUnit = 'kg'; }
      else if (clean.includes('24 patties')) { extractedYield = 24; extractedUnit = 'piece'; }
      else {
          const yieldMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|L|x|patties|slices|pieces|loaf)/i);
          if (yieldMatch) {
            extractedYield = parseFloat(yieldMatch[1].replace(',', '.'));
            const u = yieldMatch[2].toLowerCase();
            if (u === 'kg') extractedUnit = 'kg';
            else if (u === 'g') extractedUnit = 'g';
            else if (u === 'l') extractedUnit = 'L';
            else if (u === 'x' || u === 'pieces' || u === 'slices' || u === 'patties') extractedUnit = 'piece';
            else if (u === 'loaf') extractedUnit = 'loaf';
          }
      }

      let extractedName = clean
        .replace(/(?:R|=)\s*[\d.,]+(?:\s*-\s*(?:R)?\s*[\d.,]+)?/gi, '')
        .replace(/\d+(?:[.,]\d+)?\s*(?:x|kg|g|l|L|patties|slices|pieces|loaf)/gi, '')
        .replace(/\d+/g, '')
        .replace(/[=.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (clean.includes('Small 60-75')) extractedName = 'Small Box';
      if (clean.includes('Medium 60-75')) extractedName = 'Medium Box';
      if (clean.includes('Small 60-70')) extractedName = 'Small Poly';
      if (clean.includes('Large 50-60')) extractedName = 'Large Poly';
      if (clean.includes('Daveyton Russian')) { extractedName = 'Daveyton Russian'; extractedUnit = 'kg'; }

      if (extractedPrice > 0 && extractedName.length > 1) {
        results.push({
          name: extractedName,
          purchase_price: extractedPrice,
          yield_amount: extractedYield,
          unit: extractedUnit
        });
      }
    });

    setParsedPreview(results);
    setIsParsed(true);
    haptics.success();
  };

  const updatePreviewItem = (index, field, value) => {
    const newArr = [...parsedPreview];
    newArr[index][field] = field === 'name' || field === 'unit' ? value : Number(value);
    setParsedPreview(newArr);
  };

  const removePreviewItem = (index) => {
    setParsedPreview(parsedPreview.filter((_, i) => i !== index));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !yieldAmt) return alert('Please fill in all fields');
    setLoading(true);
    try {
      await addIngredient({ name, purchase_price: Number(price), yield_amount: Number(yieldAmt), unit });
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setLoading(true);
    try {
      await addBulkIngredients(parsedPreview);
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="m-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <motion.div 
        className="m-modal-sheet" 
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ height: '90dvh', display: 'flex', flexDirection: 'column', background: 'var(--ck-cream)' }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: 0, color: 'var(--ck-ink)' }}>Add Ingredients</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ck-ink-soft)' }}>Smart paste or manual entry</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* MODE TOGGLE */}
        <div style={{ display: 'flex', padding: '20px', gap: '12px', background: 'white', borderBottom: '1px solid var(--ck-border)' }}>
          <button onClick={() => { setMode('bulk'); setIsParsed(false); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '14px', background: mode === 'bulk' ? 'var(--ck-brand-deep)' : 'var(--ck-cream)', color: mode === 'bulk' ? 'white' : 'var(--ck-ink-soft)' }}>
            Smart Paste
          </button>
          <button onClick={() => setMode('manual')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '14px', background: mode === 'manual' ? 'var(--ck-brand-deep)' : 'var(--ck-cream)', color: mode === 'manual' ? 'white' : 'var(--ck-ink-soft)' }}>
            Manual Entry
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {mode === 'bulk' && !isParsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px', fontSize: '15px' }}><ClipboardPaste size={18} /> Paste your notes</h3>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>e.g., "Cheese 54x = R100-R125" or "Bread loaf = R14"</p>
              </div>
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste your raw notes here..."
                style={{ width: '100%', height: '220px', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)', fontSize: '14px', fontFamily: 'monospace', outline: 'none', background: 'white', color: 'var(--ck-ink)' }}
              />
              <button onClick={parseText} disabled={!bulkText.trim()} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                Decipher Notes <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {mode === 'bulk' && isParsed && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', color: 'var(--ck-green)' }}>
                <CheckCircle2 size={18} /> Review & Edit
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {parsedPreview.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--ck-border)', alignItems: 'center' }}>
                    <input value={item.name} onChange={(e) => updatePreviewItem(i, 'name', e.target.value)} placeholder="Name" style={{ flex: '1 1 100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input type="number" value={item.purchase_price} onChange={(e) => updatePreviewItem(i, 'purchase_price', e.target.value)} placeholder="Price" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input type="number" value={item.yield_amount} onChange={(e) => updatePreviewItem(i, 'yield_amount', e.target.value)} placeholder="Yield" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input value={item.unit} onChange={(e) => updatePreviewItem(i, 'unit', e.target.value)} placeholder="Unit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <button onClick={() => removePreviewItem(i)} style={{ padding: '10px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={handleBulkSubmit} disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px' }}>
                {loading ? 'Saving...' : `Confirm & Save ${parsedPreview.length} Items`}
              </button>
            </motion.div>
          )}

          {mode === 'manual' && (
            <motion.form onSubmit={handleManualSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Ingredient Name</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Bulk Price (R)</span>
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Yield</span>
                  <input type="number" value={yieldAmt} onChange={e => setYieldAmt(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                </label>
              </div>
              <label>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Unit</span>
                <input type="text" value={unit} onChange={e => setUnit(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              </label>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px', marginTop: '16px' }}>
                {loading ? 'Saving...' : 'Calculate & Save'}
              </button>
            </motion.form>
          )}

        </div>
      </motion.div>
    </div>
  );
}