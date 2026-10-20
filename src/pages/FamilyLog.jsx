import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, PackagePlus, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getAllMenu } from '../services/menuService';
import { getIngredients } from '../services/cosService';
import CKMark from '../components/CKMark';

export default function FamilyLog() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // 'sale' or 'purchase'
  const [menu, setMenu] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [success, setSuccess] = useState('');
  
  // Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    getAllMenu().then(setMenu);
    getIngredients().then(setIngredients);
  }, []);

  const handleLogSale = async (e) => {
    e.preventDefault();
    if (!selectedItem) return alert('Select an item');
    try {
      await supabase.from('orders').insert({
        channel: 'manual_log',
        status: 'completed',
        total: 0, 
        items: [{ name: selectedItem, qty: Number(amount) }],
        customer: { name: `Logged by ${user?.email?.split('@')[0]}` }
      });
      setSuccess(`Logged sale: ${amount}x ${selectedItem}`);
      setSelectedItem(''); setAmount(''); setMode(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to log sale');
    }
  };

  const handleLogPurchase = async (e) => {
    e.preventDefault();
    if (!selectedItem) return alert('Select an ingredient');
    try {
      const ing = ingredients.find(i => i.name === selectedItem);
      await supabase.from('purchase_logs').insert({
        ingredient_name: selectedItem,
        purchase_price: Number(amount),
        yield_amount: ing ? ing.yield_amount : 1,
        unit: ing ? ing.unit : 'unit'
      });
      setSuccess(`Logged purchase: ${selectedItem} for R${amount}`);
      setSelectedItem(''); setAmount(''); setMode(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to log purchase');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ck-cream)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'white', padding: '20px', borderBottom: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CKMark size={32} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ck-ink)' }}>Family Log</div>
            <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: 'transparent', border: 'none', color: 'var(--ck-achaar-red)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={18} /> Exit
        </button>
      </header>

      <main style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {success && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--ck-green)', color: 'white', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
            <CheckCircle2 size={24} /> {success}
          </motion.div>
        )}

        {!mode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <button onClick={() => setMode('sale')} style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '32px 24px', borderRadius: '24px', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(15,46,74,0.2)' }}>
              <ShoppingCart size={48} />
              <span style={{ fontSize: '20px', fontWeight: 800 }}>Log a Sale</span>
            </button>

            <button onClick={() => setMode('purchase')} style={{ background: 'white', color: 'var(--ck-brand-deep)', padding: '32px 24px', borderRadius: '24px', border: '2px solid var(--ck-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <PackagePlus size={48} />
              <span style={{ fontSize: '20px', fontWeight: 800 }}>Log Stock Purchase</span>
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'white', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '400px', margin: '0 auto', border: '1px solid var(--ck-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>
              {mode === 'sale' ? 'Log a Sale' : 'Log Stock Purchase'}
            </h2>

            <form onSubmit={mode === 'sale' ? handleLogSale : handleLogPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <label>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>
                  {mode === 'sale' ? 'Item Sold' : 'Ingredient Bought'}
                </span>
                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px', background: 'var(--ck-cream)' }}>
                  <option value="">Select...</option>
                  {mode === 'sale' 
                    ? menu.map(m => <option key={m.id} value={m.name}>{m.name}</option>)
                    : ingredients.map(i => <option key={i.id} value={i.name}>{i.name}</option>)
                  }
                </select>
              </label>

              <label>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>
                  {mode === 'sale' ? 'Quantity Sold' : 'Total Price Paid (R)'}
                </span>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px', background: 'var(--ck-cream)' }} />
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setMode(null)} style={{ flex: 1, padding: '16px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px' }}>Confirm Log</button>
              </div>

            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}