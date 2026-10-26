/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Receipt, CheckCircle2, Package, Pencil, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
  const [ledgerItems, setLedgerItems] = useState([]);
  const haptics = useHaptics();

  // EDIT MODAL STATE
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => { fetchFinancials(); }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: purchasesData } = await supabase.from('purchase_logs').select('*').order('logged_at', { ascending: false });
      const { data: expensesData } = await supabase.from('expenses').select('*').order('logged_at', { ascending: false });

      // 1. Map Sales (Cash In)
      const salesMapped = (ordersData || []).filter(o => o.status !== 'cancelled').map(o => ({
        rawId: o.id,
        id: `sale-${o.id}`,
        type: 'sale',
        displayName: o.customer?.name ? `Sale - ${o.customer.name}` : `Walk-in Sale`,
        displayDate: o.created_at,
        amount: Number(o.total)
      }));

      // 2. Map General Bills
      const generalMapped = (expensesData || []).map(e => ({
        rawId: e.id,
        id: `exp-${e.id}`,
        type: 'general',
        displayName: e.description,
        displayDate: e.logged_at,
        amount: Number(e.amount)
      }));

      // 3. Aggregate Stock/COS
      const totalCOS = (purchasesData || []).reduce((sum, p) => sum + Number(p.purchase_price), 0);
      const latestPurchaseDate = purchasesData && purchasesData.length > 0 ? purchasesData[0].logged_at : new Date().toISOString();
      
      const cosSummary = totalCOS > 0 ? [{
        rawId: null,
        id: 'cos-summary',
        type: 'cos_summary',
        displayName: 'Stock Purchases (COS Total)',
        displayDate: latestPurchaseDate,
        amount: totalCOS
      }] : [];

      // Combine and Sort
      const combined = [...salesMapped, ...generalMapped, ...cosSummary].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
      setLedgerItems(combined);

      // Calculate Totals
      const totalRevenue = salesMapped.reduce((sum, o) => sum + o.amount, 0);
      const totalExpenses = totalCOS + generalMapped.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = totalRevenue - totalExpenses;

      setStats({ revenue: totalRevenue, expenses: totalExpenses, netProfit });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingItem || editingItem.type !== 'general') return;
    setIsSavingEdit(true);
    haptics.success();

    try {
      await supabase.from('expenses').update({
        description: editingItem.displayName,
        amount: Number(editingItem.amount)
      }).eq('id', editingItem.rawId);
      
      setEditingItem(null);
      fetchFinancials();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem || editingItem.type !== 'general') return;
    setIsSavingEdit(true);
    haptics.success();

    try {
      await supabase.from('expenses').delete().eq('id', editingItem.rawId);
      setEditingItem(null);
      fetchFinancials();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const exportToCSV = () => {
    haptics.light();
    const headers = "Date,Type,Description,Amount\n";
    const ledgerRows = ledgerItems.map(e => `${new Date(e.displayDate).toLocaleDateString()},${e.type === 'sale' ? 'Sale' : e.type === 'general' ? 'Expense' : 'Stock Purchase'},"${e.displayName}",${e.type === 'sale' ? '' : '-'}${e.amount}`).join('\n');
    const csvContent = headers + ledgerRows;

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
    <div className="admin-finance-page" style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)' }}>
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

      {/* FINANCIAL LEDGER HISTORY */}
      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '4px' }}>Recent Financial Records</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ledgerItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)', background: 'white', borderRadius: '20px', border: '1px dashed var(--ck-border)' }}>No financial records found.</div>
        ) : (
          ledgerItems.map((item) => {
            const isSale = item.type === 'sale';
            const isGeneral = item.type === 'general';
            const isCOS = item.type === 'cos_summary';

            return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                onClick={() => { 
                  if (isGeneral) { haptics.light(); setEditingItem(item); }
                }}
                style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)', alignItems: 'center', cursor: isGeneral ? 'pointer' : 'default', transition: 'transform 0.1s' }}
                whileTap={isGeneral ? { scale: 0.98 } : {}}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: isSale ? 'rgba(76, 175, 80, 0.1)' : isGeneral ? 'rgba(229, 57, 53, 0.1)' : 'var(--ck-cream)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: isSale ? 'var(--ck-green)' : isGeneral ? 'var(--ck-achaar-red)' : 'var(--ck-brand-deep)' 
                  }}>
                    {isSale ? <TrendingUp size={18} /> : isGeneral ? <Receipt size={18} /> : <Package size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)' }}>
                      {item.displayName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>
                      {new Date(item.displayDate).toLocaleDateString()}
                      {isCOS && ' • Auto-summarized from Stock'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: isSale ? 'var(--ck-green)' : 'var(--ck-achaar-red)' }}>
                    {isSale ? '+' : '-'} R {Number(item.amount).toFixed(2)}
                  </div>
                  {isGeneral && <Pencil size={16} color="var(--ck-ink-soft)" />}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* EDIT BOTTOM SHEET MODAL (Only for General Bills) */}
      <AnimatePresence>
        {editingItem && editingItem.type === 'general' && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setEditingItem(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 1000, maxWidth: '600px', margin: '0 auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--ck-ink)' }}>Edit General Bill</h3>
                <button onClick={() => setEditingItem(null)} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} color="var(--ck-ink-soft)" /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Description</label>
                  <input 
                    value={editingItem.displayName} 
                    onChange={(e) => setEditingItem({ ...editingItem, displayName: e.target.value })}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Amount (R)</label>
                  <input 
                    type="number"
                    value={editingItem.amount} 
                    onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  onClick={handleDelete} 
                  disabled={isSavingEdit}
                  style={{ padding: '14px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '99px', fontWeight: 800, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Trash2 size={18} /> Delete
                </button>
                <button 
                  onClick={handleEditSubmit} 
                  disabled={isSavingEdit}
                  style={{ flex: 2, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingEdit ? 'Saving...' : <><CheckCircle2 size={18} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
