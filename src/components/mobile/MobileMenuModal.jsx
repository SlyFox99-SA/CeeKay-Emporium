import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, AlertTriangle, TrendingUp, Plus, Trash2, ChefHat } from 'lucide-react';
import MobileImageUploader from './MobileImageUploader';
import { useHaptics } from '../../hooks/useHaptics';
import { getIngredients } from '../../services/cosService';

export default function MobileMenuModal({ item, onClose, onSave }) {
  const haptics = useHaptics();
  const [allIngredients, setAllIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const [form, setForm] = useState({ 
    ...item,
    stock_quantity: item.stock_quantity ?? '',
    manually_sold_out: item.manually_sold_out ?? false,
    available: item.available ?? true,
    recipe: item.recipe || [] // Array of { ingredient_id, qty }
  });
  
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getIngredients().then(data => {
      setAllIngredients(data);
      setLoadingIngredients(false);
      if (data.length > 0) setSelectedIngId(data[0].id);
    });
  }, []);

  // Calculate cost from recipe
  const calculateRecipeCost = () => {
    return form.recipe.reduce((total, r) => {
      const ing = allIngredients.find(i => i.id === r.ingredient_id);
      if (!ing) return total;
      const costPerUnit = ing.purchase_price / ing.yield_amount;
      return total + (costPerUnit * r.qty);
    }, 0);
  };

  const autoCost = calculateRecipeCost();
  
  // Profit Calcs
  const sellingPrice = Number(form.price) || 0;
  // Use autoCost if recipe exists, otherwise fallback to manual cost_price
  const costPrice = form.recipe.length > 0 ? autoCost : (Number(form.cost_price) || 0);
  const targetMargin = Number(form.min_profit_margin) || 50;
  
  const profitAmount = sellingPrice - costPrice;
  const actualMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;
  const isBelowTarget = actualMargin < targetMargin;

  const addIngredient = () => {
    if (!selectedIngId || Number(selectedQty) <= 0) return;
    haptics.light();
    const existing = form.recipe.find(r => r.ingredient_id === selectedIngId);
    
    let newRecipe;
    if (existing) {
      newRecipe = form.recipe.map(r => r.ingredient_id === selectedIngId ? { ...r, qty: r.qty + Number(selectedQty) } : r);
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

  const handleSave = async () => {
    haptics.success();
    setSaving(true);
    
    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      desc: form.desc,
      image: form.image,
      stock_quantity: form.stock_quantity === '' ? null : Number(form.stock_quantity),
      manually_sold_out: !!form.manually_sold_out,
      available: !!form.available,
      cost_price: Number(costPrice.toFixed(2)),
      min_profit_margin: Number(form.min_profit_margin),
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
          
          {/* BASIC INFO */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Name</span>
              <input style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Category</span>
              <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', background: 'white' }} value={form.category || 'kota'} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="kota">Kota</option>
                <option value="drink">Drink</option>
              </select>
            </label>
            
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Description</span>
              <textarea style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'vertical' }} value={form.desc || ''} onChange={e => setForm({ ...form, desc: e.target.value })} />
            </label>
          </div>

          {/* RECIPE BUILDER */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
              <ChefHat size={18} /> Recipe (Cost to Make)
            </h3>
            
            {loadingIngredients ? (
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ck-ink-soft)' }}>Loading ingredients...</div>
            ) : allIngredients.length === 0 ? (
              <div style={{ background: '#FFF4E5', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--ck-charcoal)', marginBottom: '16px' }}>
                No ingredients found. Go to <b>Cost of Sales</b> first to add bulk items.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
                  <label style={{ flex: 2 }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '4px' }}>Ingredient</span>
                    <select value={selectedIngId} onChange={e => setSelectedIngId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', outline: 'none' }}>
                      {allIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} (R{(ing.purchase_price/ing.yield_amount).toFixed(2)}/{ing.unit})</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '4px' }}>Qty</span>
                    <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', outline: 'none' }} />
                  </label>
                  <button onClick={addIngredient} style={{ padding: '12px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Plus size={18} />
                  </button>
                </div>

                {form.recipe.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '12px' }}>
                    {form.recipe.map(r => {
                      const ing = allIngredients.find(i => i.id === r.ingredient_id);
                      if (!ing) return null;
                      const cost = (ing.purchase_price / ing.yield_amount) * r.qty;
                      return (
                        <div key={r.ingredient_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <div><strong>{r.qty}x</strong> {ing.name} <span style={{ color: 'var(--ck-ink-soft)' }}>(R{cost.toFixed(2)})</span></div>
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

          {/* PROFIT GUARD */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
              <TrendingUp size={18} /> Profit Guard
            </h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <label style={{ flex: 1, display: 'block' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Selling Price (R)</span>
                <input type="number" step="0.01" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} />
              </label>
              <label style={{ flex: 1, display: 'block' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Cost to Make (R)</span>
                <input type="number" step="0.01" disabled={form.recipe.length > 0} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', background: form.recipe.length > 0 ? 'var(--ck-cream)' : 'white' }} value={costPrice.toFixed(2)} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
                {form.recipe.length > 0 && <div style={{ fontSize: '10px', color: 'var(--ck-ink-soft)', marginTop: '4px' }}>Auto-calculated from recipe</div>}
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '6px' }}>Minimum Target Margin (%)</span>
              <input type="number" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.min_profit_margin} onChange={e => setForm({ ...form, min_profit_margin: e.target.value })} />
            </label>

            {/* LIVE CALCULATION */}
            <div style={{ padding: '16px', borderRadius: '12px', background: isBelowTarget ? 'rgba(229, 57, 53, 0.1)' : 'rgba(76, 175, 80, 0.1)', border: `1px solid ${isBelowTarget ? '#E53935' : 'var(--ck-green)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink)' }}>Actual Margin:</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: isBelowTarget ? '#E53935' : 'var(--ck-green)' }}>{actualMargin.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink)' }}>Profit per item:</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: isBelowTarget ? '#E53935' : 'var(--ck-green)' }}>R {profitAmount.toFixed(2)}</span>
              </div>
              
              {isBelowTarget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: '#E53935', fontSize: '12px', fontWeight: 700 }}>
                  <AlertTriangle size={14} /> Below your {targetMargin}% target margin!
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Image</div>
            <MobileImageUploader value={form.image} onChange={url => setForm({ ...form, image: url })} />
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--ck-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Inventory & Status</div>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Stock Quantity (blank = unlimited)</span>
              <input type="number" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} placeholder="e.g. 50" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.manually_sold_out} onChange={e => setForm({ ...form, manually_sold_out: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: 'var(--ck-brand-deep)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Manually mark as Sold Out</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: 'var(--ck-brand-deep)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Visible on Menu</span>
            </label>
          </div>

        </div>
      </motion.div>
    </div>
  );
}