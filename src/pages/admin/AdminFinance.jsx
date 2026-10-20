import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Plus, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, cogs: 0, expenses: 0, netProfit: 0 });
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const haptics = useHaptics();

  // Expense Form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders(ordersData || []);

      // 2. Fetch Purchases
      const { data: purchasesData } = await supabase.from('purchase_logs').select('*').order('logged_at', { ascending: false });
      setPurchases(purchasesData || []);

      // 3. Fetch General Expenses
      const { data: expensesData } = await supabase.from('expenses').select('*').order('logged_at', { ascending: false });
      setExpenses(expensesData || []);

      // 4. Calculate Totals
      const totalRevenue = (ordersData || []).filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      
      // Calculate COGS based on items sold (this is a rough estimate using current menu prices)
      let totalCogs = 0;
      (ordersData || []).forEach(order => {
        (order.items || []).forEach(item => {
          // If item has a cost_price saved, use it. Otherwise 0.
          totalCogs += (Number(item.cost_price) || 0) * item.qty;
        });
      });

      const totalPurchases = (purchasesData || []).reduce((sum, p) => sum + Number(p.purchase_price), 0);
      const totalGeneralExpenses = (expensesData || []).reduce((sum, e) => sum + Number(e.amount), 0);
      
      const totalExpenses = totalPurchases + totalGeneralExpenses;
      const netProfit = totalRevenue - totalExpenses;

      setStats({ revenue: totalRevenue, cogs: totalCogs, expenses: totalExpenses, netProfit });
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

  const exportToCSV = () => {
    haptics.light();
    
    // 1. Prepare CSV Headers and Data
    const headers = "Date,Type,Reference,Description,Amount\n";
    
    const orderRows = orders.map(o => {
      const date = new Date(o.created_at).toLocaleDateString();
      return `${date},Sale,${o.order_number || o.id},"${o.customer?.name || 'Walk-in'}",${o.total}`;
    }).join('\n');

    const purchaseRows = purchases.map(p => {
      const date = new Date(p.logged_at).toLocaleDateString();
      return `${date},Stock Purchase,-,"${p.ingredient_name}",${p.purchase_price}`;
    }).join('\n');

    const expenseRows = expenses.map(e => {
      const date = new Date(e.logged_at).toLocaleDateString();
      return `${date},Expense,-,"${e.description}",${e.amount}`;
    }).join('\n');

    const csvContent = headers + orderRows + '\n' + purchaseRows + '\n' + expenseRows;

    // 2. Trigger Download
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
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Ledger</h1>
        </div>
        <button 
          onClick={exportToCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ck-brand-deep)', color: 'white', padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}
        >
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
          <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '8px' }}>Includes stock purchases & bills</div>
        </div>

        <div style={{ background: 'var(--ck-brand-deep)', padding: '20px', borderRadius: '20px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(15,46,74,0.15)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 800, opacity: 0.9 }}>
            <DollarSign size={20} /> Net Profit
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900 }}>R {loading ? '...' : stats.netProfit.toFixed(2)}</div>
        </div>

      </div>

      {/* LOG GENERAL EXPENSE */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--ck-border)', marginBottom: '32px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>
          <Receipt size={18} /> Log an Expense (Rent, Gas, Wages, etc.)
        </h3>
        <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" placeholder="Description (e.g. Gas Cylinder)" 
            value={desc} onChange={e => setDesc(e.target.value)} required 
            style={{ flex: '2 1 200px', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} 
          />
          <input 
            type="number" step="0.01" placeholder="Amount (R)" 
            value={amount} onChange={e => setAmount(e.target.value)} required 
            style={{ flex: '1 1 100px', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }} 
          />
          <button type="submit" style={{ padding: '14px 24px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> Add
          </button>
        </form>
      </div>

      {/* RECENT EXPENSES LIST */}
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

    </div>
  );
}