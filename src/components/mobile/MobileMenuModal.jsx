import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, AlertTriangle, TrendingUp, Plus, Trash2, ChefHat, CheckCircle, Wand2, Sparkles } from 'lucide-react';
import MobileImageUploader from './MobileImageUploader';
import { useHaptics } from '../../hooks/useHaptics';
import { getIngredients } from '../../services/cosService';

export default function MobileMenuModal({ item, onClose, onSave }) {
  const haptics = useHaptics();
  const [allIngredients, setAllIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const getInitialRecipe = () => {
    if (!item.recipe) return [];
    if (Array.isArray(item.recipe)) return item.recipe;
    try { return JSON.parse(item.recipe); } catch (e) { return []; }
  };

  const [form, setForm] = useState({ 
    ...item,
    stock_quantity: item.stock_quantity ?? '',
    manually_sold_out: item.manually_sold_out ?? false,
    available: item.available ?? true,
    recipe: getInitialRecipe(),
    min_profit_amount: item.min_profit_amount || 15,
    min_profit_margin: item.min_profit_margin || 60 // Default to 60% margin
  });
  
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getIngredients().then(data => {
      setAllIngredients(data);
      setLoadingIngredients(false);
      if (data.length > 0 && !selectedIngId) setSelectedIngId(data[0].id);
    });
  }, []);

  const calculateRecipeCost = () => {
    return form.recipe.reduce((total, r) => {
      const ing = allIngredients.find(i => i.id === r.ingredient_id);
      if (!ing) return total;
      const price = Number(ing.purchase_price) || 0;
      const yieldAmt = Number(ing.yield_amount) || 1; 
      const qty = Number(r.qty) || 0;
      return total + ((price / yieldAmt) * qty);
    }, 0);
  };

  const autoCost = calculateRecipeCost();
  
  const sellingPrice = Number(form.price) || 0;
  const costPrice = form.recipe.length > 0 ? autoCost : (Number(form.cost_price) || 0);
  const targetMargin = Number(form.min_profit_margin) || 60;
  const targetProfit = Number(form.min_profit_amount) || 15;
  
  const profitAmount = sellingPrice - costPrice;
  const actualMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;
  
  const isBelowMargin = actualMargin < targetMargin;
  const isBelowProfit = profitAmount < targetProfit;
  const isUnprofitable = sellingPrice <= costPrice;

  // SUGGESTED PRICE LOGIC (AI Approximation)
  // Formula: (Cost / (1 - Desired Margin%))
  const suggestedPriceByMargin = costPrice / (1 - (targetMargin / 100));
  const suggestedPriceByAmount = costPrice + targetProfit;
  const suggestedPrice = Math.max(suggestedPriceByMargin, suggestedPriceByAmount).toFixed(2);

  let statusColor = 'var(--ck-green)';
  let StatusIcon = CheckCircle;
  let statusText = 'Excellent Profit';

  if (isUnprofitable) {
    statusColor = '#E53935';
    StatusIcon = AlertTriangle;
    statusText = 'LOSS! Selling below cost.';
  } else if (isBelowMargin || isBelowProfit) {
    statusColor = '#FFA000'; 
    StatusIcon = AlertTriangle;
    statusText = 'Low Profit Warning';
  }

  const addIngredient = () => {
    if (!selectedIngId || Number(selectedQty) <= 0) return;
    haptics.light();
    const existing = form.recipe.find(r => r.ingredient_id === selectedIngId);
    
    let newRecipe;
    if (existing) {
      newRecipe = form.recipe.map(r => r.ingredient_id === selectedIngId ? { ...r, qty: Number(r.qty) + Number(selectedQty) } : r);
    } else {
      newRecipe = [...form.recipe, { ingredient_id: selectedIngId, qty: Number(selectedQty) }];
    }
    setForm({ ...form, recipe: newRecipe });
    setSelectedQty('1');
  };

  const removeIngredient = (id) => {
    haptics.light();
    setForm({ ...form, recipe: form.recipe.filter(r => r.ingredient_id !== id) });
  };

  const autoFillFromDescription = () => {
    if (!form.desc) return;
    const descLower = form.desc.toLowerCase();
    const newRecipe = [...form.recipe];
    let addedCount = 0;

    allIngredients.forEach(ing => {
      const ingName = ing.name.toLowerCase();
      if (descLower.includes(ingName)) {
        const exists = newRecipe.find(r => r.ingredient_id === ing.id);
        if (!exists) {
          newRecipe.push({ ingredient_id: ing.id, qty: 1 });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      setForm({ ...form, recipe: newRecipe });
      haptics.success();
    } else {
      haptics.light();
    }
  };

  const handleSave = async () => {
    haptics.success();
    setSaving(true);
    
    const safeCost = isNaN(costPrice) ? 0 : costPrice;

    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      desc: form.desc,
      image: form.image,
      stock_quantity: form.stock_quantity === '' ? null : Number(form.stock_quantity),
      manually_sold_out: !!form.manually_sold_out,
      available: !!form.available,
      cost_price: Number(safeCost.toFixed(2)),
      min_profit_margin: Number(form.min_profit_margin),
      min_profit_amount: Number(form.min_profit_amount),
      recipe: form.recipe
    };

    if (form.id) payload.id = form.id;

    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="m-modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
      <motion.div 
        className="m-modal-sheet" 
        style={{ height: '100dvh', width: '100%', background: 'var(--ck-cream)', borderRadius: 0, display: 'flex', flexDirection: 'column' }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top))', background: 'white', borderBottom: '1px solid var(--ck-border)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} color="var(--ck-ink)" />
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>
            {item.id ? 'Edit Item' : 'New Item'}
          </h2>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--ck-brand-deep)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '...' : <><Save size={16} /> Save</>}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          
          <div style={{ padding: '20px', borderRadius: '20px', background: statusColor, color: 'white', marginBottom: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
              <StatusIcon size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--ck-font-serif)' }}>{statusText}</div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Profit per item: <strong>R {profitAmount.toFixed(2)}</strong> ({actualMargin.toFixed(0)}% margin)</div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Name</span>
              <input style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Selling Price (R)</span>
              <input type="number" step="0.01" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '18px', fontWeight: 800, outline: 'none', color: 'var(--ck-brand-deep)' }} value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} />
              
              {/* AI SUGGESTED PRICE */}
              {form.recipe.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,46,74,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ck-brand-deep)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} /> Suggested Price:
                  </div>
                  <button type="button" onClick={() => setForm({ ...form, price: suggestedPrice })} style={{ background: 'var(--ck-brand-deep)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                    Apply R {suggestedPrice}
                  </button>
                </div>
              )}
            </label>
            
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Description</span>
              <textarea style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', minHeight: '60px', resize: 'vertical' }} value={form.desc || ''} onChange={e => setForm({ ...form, desc: e.target.value })} />
              <button onClick={autoFillFromDescription} style={{ marginTop: '12px', background: 'var(--ck-cream)', color: 'var(--ck-brand-deep)', border: '1px solid var(--ck-border)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                <Wand2 size={16} /> Auto-Fill Recipe from Description
              </button>
            </label>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
              <ChefHat size={18} /> Recipe Cost
            </h3>
            
            {loadingIngredients ? (
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ck-ink-soft)' }}>Loading...</div>
            ) : allIngredients.length === 0 ? (
              <div style={{ background: '#FFF4E5', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--ck-charcoal)', marginBottom: '16px' }}>No ingredients found. Go to Cost of Sales to add some.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
                  <label style={{ flex: 2 }}>
                    <select value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', outline: 'none' }}>
                      {allIngredients.map(ing => {
                        const unitCost = (Number(ing.purchase_price) / (Number(ing.yield_amount) || 1)).toFixed(2);
                        return <option key={ing.id} value={ing.id}>{ing.name} (R{unitCost} / {ing.unit || 'unit'})</option>
                      })}
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    <input type="number" step="0.01" min="0.01" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px',outline: 'none' }} />
                  </label>
                  <button onClick={addIngredient} style={{ padding: '12px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={18} /></button>
                </div>

                {form.recipe.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--ck-cream)',padding: '12px', borderRadius: '12px' }}>
                    {form.recipe.map(r => {
                      const ing = allIngredients.find(i => i.id === r.ingredient_id);
                      if (!ing) return null;
                      const cost = (Number(ing.purchase_price) / (Number(ing.yield_amount) || 1)) * r.qty;
                      return (
                        <div key={r.ingredient_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <div><strong>{r.qty} {ing.unit || 'unit'}</strong> {ing.name} <span style={{ color: 'var(--ck-ink-soft)' }}>(R{cost.toFixed(2)})</span></div>
                          <button onClick={() => removeIngredient(r.ingredient_id)} style={{ background: 'transparent', border: 'none', color: '#E53935', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                    <div style={{ borderTop: '1px solid var(--ck-border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
                      <span>Total Auto-Cost:</span>
                      <span>R {autoCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
              <TrendingUp size={18} /> Profit Targets
            </h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <label style={{ flex: 1, display: 'block' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Cost to Make (R)</span>
                <input type="number" step="0.01" disabled={form.recipe.length > 0} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', background: form.recipe.length > 0 ? 'var(--ck-cream)' : 'white' }} value={costPrice.toFixed(2)} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
              </label>
              <label style={{ flex: 1, display: 'block' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Min Profit (R)</span>
                <input type="number" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.min_profit_amount} onChange={e => setForm({ ...form, min_profit_amount: e.target.value })} />
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Target Margin (%)</span>
              <input type="number" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.min_profit_margin} onChange={e => setForm({ ...form, min_profit_margin: e.target.value })} />
            </label>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Image</div>
            <MobileImageUploader value={form.image} onChange={url => setForm({ ...form, image: url })} />
          </div>

        </div>
      </motion.div>
    </div>
  );
}