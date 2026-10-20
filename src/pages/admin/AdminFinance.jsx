import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Plus, Receipt, ClipboardPaste, Calculator, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { getIngredients, addIngredient, addBulkIngredients, deleteIngredient } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl', 'expenses', 'ingredients'
  const haptics = useHaptics();

  // General Expense Form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  // Ingredient Form (COS)
  const [ingName, setIngName] = useState('');
  const [ingPrice, setIngPrice] = useState('');
  const [ingYield, setIngYield] = useState('');
  const [ingUnit, setIngUnit] = useState('slice');
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: purchasesData } = await supabase.from('purchase_logs').select('*').order('logged_at', { ascending: false });
      const { data: expensesData } = await supabase.from('expenses').select('*').order('logged_at', { ascending: false });
      const ingredientsData = await getIngredients();

      setOrders(ordersData || []);
      setPurchases(purchasesData || []);
      setExpenses(expensesData || []);
      setIngredients(ingredientsData || []);

      const totalRevenue = (ordersData || []).filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      const totalPurchases = (purchasesData || []).reduce((sum, p) => sum + Number(p.purchase_price), 0);
      const totalGeneralExpenses = (expensesData || []).reduce((sum, e) => sum + Number(e.amount), 0);
      
      const totalExpenses = totalPurchases + totalGeneralExpenses;
      const netProfit = totalRevenue - totalExpenses;

      setStats({ revenue: totalRevenue, expenses: totalExpenses, netProfit });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    haptics.success();
    await supabase.from('expenses').insert({ description: desc, amount: Number(amount) });
    setDesc(''); setAmount('');
    fetchFinancials();
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!ingName || !ingPrice || !ingYield) return;
    haptics.success();
    await addIngredient({ name: ingName, purchase_price: Number(ingPrice), yield_amount: Number(ingYield), unit: ingUnit });
    setIngName(''); setIngPrice(''); setIngYield('');
    fetchFinancials();
  };

  const parseText = () => {
    setIsParsing(true);
    const lines = bulkText.split('\n');
    const results = [];

    lines.forEach(line => {
      let clean = line.trim();
      if (!clean || ['packaging boxes', 'polystyrene packaging', 'sauce\'s'].includes(clean.toLowerCase())) return;

      let extractedPrice = 0;
      let extractedYield = 1;
      let extractedUnit = 'unit';

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
        results.push({ name: extractedName, purchase_price: extractedPrice, yield_amount: extractedYield, unit: extractedUnit });
      }
    });

    setParsedPreview(results);
    setIsParsing(false);
  };

  const handleBulkSubmit = async () => {
    haptics.success();
    await addBulkIngredients(parsedPreview);
    setBulkText('');
    setParsedPreview([]);
    fetchFinancials();
  };

  const handleDeleteIngredient = async (id) => {
    if (!confirm('Delete this ingredient?')) return;
    haptics.light();
    await deleteIngredient(id);
    fetchFinancials();
  };

  const exportToCSV = () => {
    haptics.light();
    const headers = "Date,Type,Reference,Description,Amount\n";
    const orderRows = orders.map(o => `${new Date(o.created_at).toLocaleDateString()},Sale,${o.order_number || o.id},"${o.customer?.name || 'Walk-in'}",${o.total}`).join('\n');
    const purchaseRows = purchases.map(p => `${new Date(p.logged_at).toLocaleDateString()},Stock Purchase,-,"${p.ingredient_name}",${p.purchase_price}`).join('\n');
    const expenseRows = expenses.map(e => `${new Date(e.logged_at).toLocaleDateString()},Expense,-,"${e.description}",${e.amount}`).join('\n');
    const csvContent = headers + orderRows + '\n' + purchaseRows + '\n' + expenseRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CeeKay_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Financial Hub</h1>
        </div>
        <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ck-brand-deep)', color: 'white', padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}>
          <Download size={18} /> Export CSV
        </button>
      </header>

      {/* P&L SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ck-green)', marginBottom: '12px', fontWeight: 800 }}>
            <TrendingUp size={20} /> Total Revenue
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--ck-ink)' }}>R {loading ? '...' : stats.revenue.toFixed(2)}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ck-achaar-red)', marginBottom: '12px', fontWeight: 800 }}>
            <TrendingDown size={20} /> Total Expenses
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--ck-ink)' }}>R {loading ? '...' : stats.expenses.toFixed(2)}</div>
        </div>

        <div style={{ background: 'var(--ck-brand-deep)', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(15,46,74,0.15)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 800, opacity: 0.9 }}>
            <DollarSign size={20} /> Net Profit
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900 }}>R {loading ? '...' : stats.netProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--ck-border)' }}>
        <button onClick={() => setActiveTab('pnl')} style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'pnl' ? '3px solid var(--ck-brand-deep)' : '3px solid transparent', color: activeTab === 'pnl' ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>Expenses</button>
        <button onClick={() => setActiveTab('ingredients')} style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'ingredients' ? '3px solid var(--ck-brand-deep)' : '3px solid transparent', color: activeTab === 'ingredients' ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>Ingredient Costs (COS)</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'pnl' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--ck-border)', marginBottom: '32px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
              <Receipt size={18} /> Log General Expense
            </h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Description (e.g. Gas Cylinder)" value={desc} onChange={e => setDesc(e.target.value)} required style={{ flex: '2 1 200px', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              <input type="number" step="0.01" placeholder="Amount (R)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ flex: '1 1 100px', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              <button type="submit" style={{ padding: '14px 24px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={18} /> Add</button>
            </form>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', marginBottom: '16px' }}>Recent General Expenses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.length === 0 ? <p style={{ color: 'var(--ck-ink-soft)' }}>No general expenses logged yet.</p> : expenses.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)' }}>{e.description}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>{new Date(e.logged_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-achaar-red)' }}>- R {Number(e.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'ingredients' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* INGREDIENTS (Formerly COS) */}
          {!parsedPreview.length ? (
            <div style={{ background: 'linear-gradient(135deg, #1e5f9c, var(--ck-brand-deep))', borderRadius: '24px', padding: '20px', marginBottom: '24px', color: 'white', boxShadow: '0 8px 25px rgba(15,46,74,0.2)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px', fontSize: '16px', fontWeight: 800 }}><ClipboardPaste size={18} /> Smart Paste Notes</h3>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 16px', lineHeight: 1.4 }}>Paste your raw notes. The AI will decipher prices, yields, and units automatically.</p>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Bread per loaf=R14&#10;Cheese 54x = R100-R125" style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '14px', fontFamily: 'monospace', outline: 'none', marginBottom: '12px', background: 'rgba(255,255,255,0.9)', color: 'var(--ck-ink)' }} />
              <button onClick={parseText} disabled={!bulkText.trim() || isParsing} style={{ width: '100%', padding: '14px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {isParsing ? 'Deciphering...' : 'Decipher Notes'} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '2px solid var(--ck-green)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-green)' }}><CheckCircle2 size={18} /> Review & Edit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {parsedPreview.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '12px', alignItems: 'center' }}>
                    <input value={item.name} onChange={(e) => { const n = [...parsedPreview]; n[i].name = e.target.value; setParsedPreview(n); }} placeholder="Name" style={{ flex: '1 1 100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input type="number" value={item.purchase_price} onChange={(e) => { const n = [...parsedPreview]; n[i].purchase_price = Number(e.target.value); setParsedPreview(n); }} placeholder="Price" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input type="number" value={item.yield_amount} onChange={(e) => { const n = [...parsedPreview]; n[i].yield_amount = Number(e.target.value); setParsedPreview(n); }} placeholder="Yield" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <input value={item.unit} onChange={(e) => { const n = [...parsedPreview]; n[i].unit = e.target.value; setParsedPreview(n); }} placeholder="Unit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                    <button onClick={() => setParsedPreview(parsedPreview.filter((_, idx) => idx !== i))} style={{ padding: '10px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setParsedPreview([])} style={{ flex: 1, padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Cancel</button>
                <button onClick={handleBulkSubmit} style={{ flex: 2, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Confirm & Save</button>
              </div>
            </div>
          )}

          <form onSubmit={handleAddIngredient} style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}><Calculator size={18} /> Manual Entry</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <input type="text" placeholder="Ingredient Name" value={ingName} onChange={e => setIngName(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="number" step="0.01" placeholder="Bulk Price (R)" value={ingPrice} onChange={e => setIngPrice(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                <input type="number" placeholder="Yield" value={ingYield} onChange={e => setIngYield(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
              </div>
              <input type="text" placeholder="Unit (slice, loaf, gram)" value={ingUnit} onChange={e => setIngUnit(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px' }}><Plus size={18} /> Calculate & Save</button>
          </form>

          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', marginBottom: '16px' }}>Ingredient Costs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ingredients.map(ing => {
              const costPerUnit = (ing.purchase_price / ing.yield_amount);
              return (
                <motion.div key={ing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>Bulk: R{ing.purchase_price} for {ing.yield_amount} {ing.unit}s</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', background: 'var(--ck-cream)', padding: '8px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Cost / {ing.unit}</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                    </div>
                    <button onClick={() => handleDeleteIngredient(ing.id)} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}><Trash2 size={18} /></button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}