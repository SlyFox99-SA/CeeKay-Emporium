/* eslint-disable no-undef */
 
import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

export function StockEditor({ item, onSaved }) {
  const [stock, setStock]         = useState(item.stock_quantity ?? '');
  const [threshold, setThreshold] = useState(item.low_stock_threshold ?? 5);
  const [soldOut, setSoldOut]     = useState(item.manually_sold_out);
  const [saving, setSaving]       = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { data, error } = await supabase
      .from('menu_items')
      .update({
        stock_quantity:      stock === '' ? null : Number(stock),
        low_stock_threshold: Number(threshold),
        manually_sold_out:   soldOut,
      })
      .eq('id', item.id)
      .select()
      .single();
      setSaving(false);
      if (error) throw error;
      onSaved?.(data);
    } catch (err) {
      console.error('Stock update failed:', err);
      setSaving(false);
    }
    if (!error) onSaved?.(data);
  }

  const isLow = item.stock_quantity != null
    && item.stock_quantity <= (item.low_stock_threshold ?? 5);

  return (
    <div className="ck-stock-editor">
      <label>
        Stock <span className="ck-stock-editor__hint">(blank = unlimited)</span>
        <input type="number" min="0" inputMode="numeric"
          value={stock} onChange={(e) => setStock(e.target.value)} />
      </label>
      <label>
        Low-stock alert at
        <input type="number" min="0" inputMode="numeric"
          value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      </label>
      <label className="ck-stock-editor__toggle">
        <input type="checkbox" checked={soldOut}
          onChange={(e) => setSoldOut(e.target.checked)} />
        Manually sold out
      </label>
      {isLow && <span className="ck-stock-editor__low">Low stock</span>}
      <button onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}


