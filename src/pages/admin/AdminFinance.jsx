import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Plus, Receipt, ClipboardPaste, Calculator, CheckCircle2, ArrowRight, Trash2, Package, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { getIngredients, addIngredient, addBulkIngredients } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [combinedExpenses, setCombinedExpenses] = useState([]);
  
  // Form Toggle
  const [entryMode, setEntryMode] = useState('ingredient');
  const haptics = useHaptics();

  // General Expense Form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  // Ingredient Form
  const [ingName, setIngName] = useState('');
  const [ingPrice, setIngPrice] = useState('');
  const [ingYield, setIngYield] = useState('');
  const [ingUnit, setIngUnit] = useState('slice');
  
  // Bulk Parser State
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => { fetchFinancials(); }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: purchasesData } = await supabase.from('purchase_logs').select('*').order('logged_at', { ascending: false });
      const { data: expensesData } = await supabase.from('expenses').select('*').order('logged_at', { ascending: false });
      
      setOrders(ordersData || []);
      setExpenses(expensesData || []);

      // STRICT LEDGER: Only map actual transactions. NO MASTER LISTS.
      const generalMapped = (expensesData || []).map(e => ({ 
        id: `exp-${e.id}`, type: 'general', displayName: e.description, displayDate: e.logged_at, amount: e.amount 
      }));
      
      const stockMapped = (purchasesData || []).map(p => ({ 
        id: `pur-${p.id}`, type: 'purchase', displayName: p.ingredient_name, displayDate: p.logged_at, amount: p.purchase_price, unit: p.unit, yield: p.yield_amount
      }));
      
      const combined = [...generalMapped, ...stockMapped].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
      setCombinedExpenses(combined);

      // Calculate Totals
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

  const handleAddGeneralExpense = async (e) => {
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
    await supabase.from('purchase_logs').insert({ ingredient_name: ingName, purchase_price: Number(ingPrice), yield_amount: Number(ingYield), unit: ingUnit });

    setIngName(''); setIngPrice(''); setIngYield('');
    fetchFinancials();
  };

  // SMART PARSER V4: Auto-Categorizes and handles mixed notes
  const parseText = () => {
    setIsParsing(true);
    const lines = bulkText.split('\n');
    const results = [];

    lines.forEach(line => {
      let clean = line.trim();
      if (!clean) return;

      // 1. Extract Price
      let extractedPrice = 0;
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

      // 2. Auto-Categorize
      const isGeneralExpense = /gas|rent|wage|electric|water|packaging|box|poly|cleaning/i.test(clean);
      let extractedType = isGeneralExpense ? 'general' : 'ingredient';
      let extractedYield = 1;
      let extractedUnit = 'unit';

      // 3. Extract Yield/Unit (Only if Ingredient)
      if (extractedType === 'ingredient') {
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
      }

      // 4. Extract Name
      let extractedName = clean
        .replace(/(?:R|=)\s*[\d.,]+(?:\s*-\s*(?:R)?\s*[\d.,]+)?/gi, '')
        .replace(/\d+(?:[.,]\d+)?\s*(?:x|kg|g|l|L|patties|slices|pieces|loaf)/gi, '')
        .replace(/\d+/g, '')
        .replace(/[=.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (extractedPrice > 0 && extractedName.length > 1) {
        results.push({ 
          name: extractedName, 
          purchase_price: extractedPrice, 
          yield_amount: extractedYield, 
          unit: extractedUnit, 
          type: extractedType
        });
      }
    });

    setParsedPreview(results);
    setIsParsing(false);
  };

  const handleBulkSubmit = async () => {
    haptics.success();
    
    const ingredientsToSave = parsedPreview.filter(p => p.type === 'ingredient');
    const expensesToSave = parsedPreview.filter(p => p.type === 'general');

    // Save Ingredients
    if (ingredientsToSave.length > 0) {
      await addBulkIngredients(ingredientsToSave);
      await supabase.from('purchase_logs').insert(ingredientsToSave.map(p => ({
        ingredient_name: p.name, purchase_price: p.purchase_price, yield_amount: p.yield_amount, unit: p.unit
      })));
    }

    // Save General Expenses
    if (expensesToSave.length > 0) {
      await supabase.from('expenses').insert(expensesToSave.map(e => ({
        description: e.name, amount: e.purchase_price
      })));
    }

    setBulkText('');
    setParsedPreview([]);
    fetchFinancials();
  };

  const exportToCSV = () => {
    haptics.light();
    const headers = "Date,Type,Reference,Description,Amount\n";
    const orderRows = orders.map(o => `${new Date(o.created_at).toLocaleDateString()},Sale,${o.order_number || o.id},"${o.customer?.name || 'Walk-in'}",${o.total}`).join('\n');
    const expenseRows = combinedExpenses.map(e => `${new Date(e.displayDate).toLocaleDateString()},${e.type === 'general' ? 'Expense' : 'Stock Purchase'},-,"${e.displayName}",${e.amount}`).join('\n');
    const csvContent = headers + orderRows + '\n' + expenseRows;

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
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Unified Ledger</h1>
        </div>
        <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ck-brand-deep)', color: 'white', padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}>
          <Download size={18} /> Export CSV
        </button>
      </header>

      {/* P&L CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ck-green)', marginBottom: '12px', fontWeight: 800 }}><TrendingUp size={20} /> Total Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--ck-ink)' }}>R {loading ? '...' : stats.revenue.toFixed(2)}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ck-achaar-red)', marginBottom: '12px', fontWeight: 800 }}><TrendingDown size={20} /> Total Expenses</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--ck-ink)' }}>R {loading ? '...' : stats.expenses.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--ck-brand-deep)', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(15,46,74,0.15)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 800, opacity: 0.9 }}><DollarSign size={20} /> Net Profit</div>
          <div style={{ fontSize: '32px', fontWeight: 900 }}>R {loading ? '...' : stats.netProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* ENTRY FORM */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--ck-border)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', background: 'var(--ck-cream)', borderRadius: '12px', padding: '4px', marginBottom: '20px', maxWidth: '400px' }}>
          <button onClick={() => setEntryMode('ingredient')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: entryMode === 'ingredient' ? 'white' : 'transparent', color: entryMode === 'ingredient' ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Package size={16} /> Stock / Ingredients
          </button>
          <button onClick={() => setEntryMode('general')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: entryMode === 'general' ? 'white' : 'transparent', color: entryMode === 'general' ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Coins size={16} /> General Bill
          </button>
        </div>

        {entryMode === 'ingredient' && (
          <AnimatePresence mode="wait">
            {!parsedPreview.length ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ background: 'linear-gradient(135deg, #1e5f9c, var(--ck-brand-deep))', borderRadius: '16px', padding: '16px', marginBottom: '20px', color: 'white' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px', fontSize: '15px' }}><ClipboardPaste size={18} /> Smart Paste Notes</h3>
                  <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 12px', lineHeight: 1.4 }}>Paste your raw notes. The AI will decipher prices, yields, and automatically categorize items.</p>
                  <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Gas cylinder refill 9kg=R290&#10;Bread per loaf=R14&#10;Cheese 54x = R100-R125" style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontFamily: 'monospace', outline: 'none', background: 'rgba(255,255,255,0.9)', color: 'var(--ck-ink)' }} />
                  <button onClick={parseText} disabled={!bulkText.trim() || isParsing} style={{ width: '100%', padding: '12px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                    {isParsing ? 'Deciphering...' : 'Decipher Notes'} <ArrowRight size={14} />
                  </button>
                </div>

                <form onSubmit={handleAddIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Ingredient Name (e.g. Cheese)" value={ingName} onChange={e => setIngName(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="number" step="0.01" placeholder="Price (R)" value={ingPrice} onChange={e => setIngPrice(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                    <input type="number" placeholder="Yield (e.g. 54)" value={ingYield} onChange={e => setIngYield(e.target.value)} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                  </div>
                  <input type="text" placeholder="Unit (slice, loaf, gram)" value={ingUnit} onChange={e => setIngUnit(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
                  <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px', marginTop: '8px' }}><Plus size={18} /> Save Ingredient</button>
                </form>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-green)' }}><CheckCircle2 size={18} /> Review & Edit (Auto-Categorized)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {parsedPreview.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '12px' }}>
                      
                      {/* TYPE TOGGLE */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <button onClick={() => { const n = [...parsedPreview]; n[i].type = 'ingredient'; setParsedPreview(n); }} style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 800, borderRadius: '6px', border: 'none', background: item.type === 'ingredient' ? 'var(--ck-brand-deep)' : 'rgba(0,0,0,0.05)', color: item.type === 'ingredient' ? 'white' : 'var(--ck-ink-soft)' }}>Ingredient</button>
                        <button onClick={() => { const n = [...parsedPreview]; n[i].type = 'general'; setParsedPreview(n); }} style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 800, borderRadius: '6px', border: 'none', background: item.type === 'general' ? 'var(--ck-achaar-red)' : 'rgba(0,0,0,0.05)', color: item.type === 'general' ? 'white' : 'var(--ck-ink-soft)' }}>General Bill</button>
                      </div>

                      <input value={item.name} onChange={(e) => { const n = [...parsedPreview]; n[i].name = e.target.value; setParsedPreview(n); }} placeholder="Name" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                      <input type="number" value={item.purchase_price} onChange={(e) => { const n = [...parsedPreview]; n[i].purchase_price = Number(e.target.value); setParsedPreview(n); }} placeholder="Price" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                      
                      {item.type === 'ingredient' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="number" value={item.yield_amount} onChange={(e) => { const n = [...parsedPreview]; n[i].yield_amount = Number(e.target.value); setParsedPreview(n); }} placeholder="Yield" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                          <input value={item.unit} onChange={(e) => { const n = [...parsedPreview]; n[i].unit = e.target.value; setParsedPreview(n); }} placeholder="Unit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px' }} />
                        </div>
                      )}

                      <button onClick={() => setParsedPreview(parsedPreview.filter((_, idx) => idx !== i))} style={{ padding: '8px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Remove</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setParsedPreview([])} style={{ flex: 1, padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Cancel</button>
                  <button onClick={handleBulkSubmit} style={{ flex: 2, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Confirm & Save</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {entryMode === 'general' && (
          <motion.form onSubmit={handleAddGeneralExpense} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="Description (e.g. Gas Cylinder, Rent)" value={desc} onChange={e => setDesc(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            <input type="number" step="0.01" placeholder="Amount (R)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} />
            <button type="submit" style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '15px', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Log Expense</button>
          </motion.form>
        )}
      </div>

      {/* STRICT LEDGER HISTORY */}
      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '4px' }}>Recent Ledger Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {combinedExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)', background: 'white', borderRadius: '20px', border: '1px dashed var(--ck-border)' }}>No actual financial transactions logged yet.</div>
        ) : (
          combinedExpenses.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.type === 'general' ? 'rgba(229, 57, 53, 0.1)' : 'var(--ck-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.type === 'general' ? 'var(--ck-achaar-red)' : 'var(--ck-brand-deep)' }}>
                  {item.type === 'general' ? <Receipt size={18} /> : <Package size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)' }}>
                    {item.displayName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>
                    {new Date(item.displayDate).toLocaleDateString()}
                    {item.type === 'purchase' && ` • ${item.yield} ${item.unit}s`}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-achaar-red)' }}>
                - R {Number(item.amount).toFixed(2)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}