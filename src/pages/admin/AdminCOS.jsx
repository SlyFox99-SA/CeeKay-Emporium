import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getIngredients, addIngredient, deleteIngredient } from '../../services/cosService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminCOS() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const haptics = useHaptics();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', text: 'Hi! Paste your notes or type naturally. E.g.,\n"Cheese 54 slices R125"\n"I bought 5L oil for R180"\n"Bread loaf = R14"\n\nI will figure it out!', type: 'info' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // --- VERSATILE PARSER V4 ---
  const parseLine = (line) => {
    let clean = line.trim();
    if (!clean) return null;

    // 1. Extract Price (Look for largest number, handling ranges like 100-125)
    let price = 0;
    const priceMatches = [...clean.matchAll(/(?:R|rand|=)?\s*(\d+(?:[.,]\d+)?)(?:\s*-\s*(?:R|rand)?\s*(\d+(?:[.,]\d+)?))?/gi)];
    
    if (priceMatches.length > 0) {
      // Find the highest price in case of ranges or multiple numbers
      const allNums = priceMatches.flatMap(m => [m[1], m[2]].filter(Boolean).map(n => parseFloat(n.replace(',', '.'))));
      if (allNums.length > 0) price = Math.max(...allNums);
    }

    if (price === 0) return null; // Can't do anything without a price

    // 2. Extract Yield and Unit
    let yieldAmt = 1;
    let unit = 'unit';
    
    // Look for unit patterns (e.g., 54x, 10kg, 5L, 24 patties)
    const yieldMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(x|kg|g|l|ml|slices|pieces|patties|loaf|loaves|bags|bag|boxes|box)/i);
    if (yieldMatch) {
      yieldAmt = parseFloat(yieldMatch[1].replace(',', '.'));
      const u = yieldMatch[2].toLowerCase();
      
      // Standardize units
      if (['kg', 'g', 'l', 'ml'].includes(u)) unit = u;
      else if (['x', 'slices', 'pieces', 'patties'].includes(u)) unit = 'piece';
      else if (['loaf', 'loaves'].includes(u)) unit = 'loaf';
      else if (['bags', 'bag'].includes(u)) unit = 'bag';
      else if (['boxes', 'box'].includes(u)) unit = 'box';
    }

    // 3. Extract Name (Strip out prices, yields, and filler words)
    let name = clean
      .replace(/(?:R|rand|=)?\s*\d+(?:[.,]\d+)?(?:\s*-\s*(?:R)?\s*\d+(?:[.,]\d+)?)?/gi, '') // Strip prices
      .replace(/\d+(?:[.,]\d+)?\s*(?:x|kg|g|l|ml|slices|pieces|patties|loaf|loaves|bags|bag|boxes|box)/gi, '') // Strip yields
      .replace(/[=.-]/g, ' ') // Strip symbols
      .replace(/(?:i bought|bought|got|for|at|is|cost|costs|each|per)\s+/gi, '') // Strip filler
      .replace(/\s+/g, ' ') // Squish spaces
      .trim();

    if (name.length < 2) return null;

    return { name, purchase_price: price, yield_amount: yieldAmt, unit };
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Split by newline or commas to handle bulk pasting
      const rawLines = userMsg.text.split(/\r?\n|,/).filter(l => l.trim());
      const parsedItems = [];
      const failedLines = [];

      rawLines.forEach(line => {
        const parsed = parseLine(line);
        if (parsed) parsedItems.push(parsed);
        else failedLines.push(line.trim());
      });

      if (parsedItems.length > 0) {
        // Save all valid items to DB
        for (const item of parsedItems) {
          await addIngredient(item);
        }
        
        // Build success message
        let reply = `✅ Saved ${parsedItems.length} item(s):\n`;
        parsedItems.forEach(item => {
          reply += `• ${item.name}: R${item.purchase_price} for ${item.yield_amount} ${item.unit}(s)\n`;
        });

        if (failedLines.length > 0) {
          reply += `\n⚠️ Skipped ${failedLines.length} line(s) I didn't understand:\n`;
          failedLines.forEach(l => reply += `"${l}"\n`);
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'system', text: reply, type: 'success' }]);
        haptics.success();
        await loadData();
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: 'system', 
          text: `❌ I couldn't find valid data. Make sure you include a price and item name.\nTry:\n"Cheese R125"\n"10kg Potatoes R95"`,
          type: 'error'
        }]);
        haptics.error();
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'system', 
        text: `❌ Database error: ${err.message}`,
        type: 'error'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ingredient?')) return;
    haptics.light();
    try {
      await deleteIngredient(id);
      loadData();
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--ck-cream)' }}>
      
      <header style={{ padding: '24px 20px 16px', background: 'white', borderBottom: '1px solid var(--ck-border)', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: 0, color: 'var(--ck-ink)' }}>Cost of Sales AI</h1>
      </header>

      {/* INGREDIENT LIST */}
      <div style={{ flexShrink: 0, maxHeight: '30vh', overflowY: 'auto', padding: '16px 20px', background: 'var(--ck-cream)' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Current Ingredients ({ingredients.length})</h3>
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)' }}>Loading...</div>
        ) : ingredients.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontStyle: 'italic' }}>No ingredients yet. Start chatting below!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ingredients.map(ing => {
              const costPerUnit = (ing.purchase_price / ing.yield_amount);
              return (
                <div key={ing.id} style={{ background: 'white', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)' }}>R{ing.purchase_price} / {ing.yield_amount} {ing.unit}s</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                      <div style={{ fontSize: '9px', color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>per {ing.unit}</div>
                    </div>
                    <button onClick={() => handleDelete(ing.id)} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHAT INTERFACE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#e5ddd5' }}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}
            >
              {msg.role === 'system' && (
                <div style={{ background: 'var(--ck-brand-deep)', padding: '6px', borderRadius: '50%', flexShrink: 0 }}>
                  <Bot size={16} color="white" />
                </div>
              )}
              <div style={{
                background: msg.role === 'user' ? '#dcf8c6' : (msg.type === 'error' ? '#ffebee' : 'white'),
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'system' ? '4px' : '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '13px',
                color: msg.type === 'error' ? '#d32f2f' : 'var(--ck-ink)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4
              }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isProcessing && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px' }}>
                <div style={{ background: 'var(--ck-brand-deep)', padding: '6px', borderRadius: '50%' }}><Bot size={16} color="white" /></div>
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', fontSize: '13px', color: 'var(--ck-ink-soft)' }}>Thinking...</div>
             </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid var(--ck-border)', display: 'flex', gap: '8px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste notes or type naturally..."
            disabled={isProcessing}
            rows={1}
            style={{ flex: 1, padding: '16px', borderRadius: '24px', border: '1px solid var(--ck-border)', background: 'var(--ck-cream)', fontSize: '15px', outline: 'none', resize: 'none', maxHeight: '100px', fontFamily: 'inherit' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || isProcessing} style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, flexShrink: 0 }}>
            <Send size={20} style={{ marginLeft: '-2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
}