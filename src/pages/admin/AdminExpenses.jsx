import { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  const [form, setForm] = useState({ item_name: '', quantity: '', unit: 'kg', total_price: '' });

  const loadExpenses = async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('logged_at', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    haptics.success();
    await supabase.from('expenses').insert({
      item_name: form.item_name,
      quantity: Number(form.quantity),
      unit: form.unit,
      total_price: Number(form.total_price)
    });
    setForm({ item_name: '', quantity: '', unit: 'kg', total_price: '' });
    loadExpenses();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.total_price), 0);

  return (
    <div style={{ padding: '24px 20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Expenses</h1>
      </header>

      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Log New Expense</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Item (e.g. Potatoes)" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }} />
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }}>
              <option value="kg">kg</option>
              <option value="loaf">loaf</option>
              <option value="pack">pack</option>
              <option value="litre">litre</option>
            </select>
          </div>
          <input type="number" placeholder="Total Price (R)" value={form.total_price} onChange={e => setForm({...form, total_price: e.target.value})} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }} />
          <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--ck-brand-deep)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 700, marginTop: '8px' }}>
            <Plus size={18} /> Add Expense
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Recent Expenses</h3>
        <span style={{ fontWeight: 800, color: 'var(--ck-achaar-red)' }}>Total: R {totalExpenses.toFixed(2)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {expenses.map(exp => (
          <div key={exp.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--ck-border)' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{exp.item_name}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>{exp.quantity} {exp.unit} • {new Date(exp.logged_at).toLocaleDateString()}</p>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--ck-brand-deep)' }}>R {Number(exp.total_price).toFixed(2)}</div>
          </div>
        ))}
        {expenses.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ck-ink-soft)' }}>No expenses logged yet.</div>}
      </div>
    </div>
  );
}