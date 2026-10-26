import { useState, useEffect } from 'react';
import { Plus, Trash2, ClipboardPaste, CheckCircle2, X, AlertCircle, Pencil, Wand2, Check, RefreshCw, Settings, Sparkles, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIngredients, deleteIngredient, addBulkIngredients } from '../../services/cosService';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';
import AddCOSModal from '../../components/mobile/AddCOSModal';

// 🧠 THE LOCAL CHEF'S BRAIN (Offline Fallback Dictionary)
const AI_YIELD_MAP = {
  'polony': { yield: 30, unit: 'slice' },
  'bread': { yield: 4, unit: 'portion' },
  'cheese': { yield: 20, unit: 'slice' },
  'achaar': { yield: 50, unit: 'tsp' },
  'vienna': { yield: 10, unit: 'piece' },
  'russian': { yield: 10, unit: 'piece' },
  'patty': { yield: 24, unit: 'piece' },
  'patties': { yield: 24, unit: 'piece' },
  'sauce': { yield: 50, unit: 'tbsp' },
  'chips': { yield: 10, unit: 'portion' },
  'lettuce': { yield: 1, unit: 'head' },
  'butter': { yield: 20, unit: 'pat' },
  'egg': { yield: 1, unit: 'egg' }
};

// 🚨 LATEST STABLE MODEL
const GEMINI_MODEL = "gemini-3.8-flash";

export default function AdminCOS() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const haptics = useHaptics();

  // AI CONFIG STATE
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [useGemini, setUseGemini] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');

  // SMART PASTE STATE
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // CUSTOM UI STATE
  const [deletingId, setDeletingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Load AI settings
  useEffect(() => {
    const savedKey = localStorage.getItem('ck_gemini_key');
    const savedToggle = localStorage.getItem('ck_use_gemini');
    if (savedKey) setGeminiKey(savedKey);
    if (savedToggle === 'true') setUseGemini(true);
  }, []);

  const saveAiSettings = (key, toggle) => {
    localStorage.setItem('ck_gemini_key', key);
    localStorage.setItem('ck_use_gemini', toggle.toString());
    setGeminiKey(key);
    setUseGemini(toggle);
    haptics.success();
    showToast(toggle ? 'Gemini AI Enabled' : 'Local AI Enabled');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    haptics.light();
    try {
      await deleteIngredient(deletingId);
      setDeletingId(null);
      loadData();
    } catch (err) { 
      setDeletingId(null);
      showToast('Failed to delete ingredient'); 
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSavingEdit(true);
    haptics.success();

    try {
      const { error } = await supabase.from('ingredients').update({
        name: editingItem.name,
        purchase_price: Number(editingItem.purchase_price),
        yield_amount: Number(editingItem.yield_amount),
        unit: editingItem.unit
      }).eq('id', editingItem.id);

      if (error) throw error;
      
      setEditingItem(null);
      loadData();
      showToast('Ingredient updated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update ingredient');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 🧠 HELPER FUNCTION: FETCH WITH RETRY LOGIC
  const fetchWithRetry = async (url, options, maxRetries = 4) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        // If it's a 503 (Service Unavailable) or 429 (Rate Limit), retry
        if (response.status === 503 || response.status === 429) {
          // If we've exhausted our retries, throw the error
          if (i === maxRetries - 1) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API is experiencing high demand. Please try again later.');
          }
          
          // Calculate exponential backoff (1s, 2s, 4s, 8s)
          const delay = Math.pow(2, i) * 1000;
          showToast(`Server busy. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry the loop
        }
        
        // If it's any other error, throw immediately
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || 'Gemini API Error');
        }

        return response; // Success
        
      } catch (err) {
        if (i === maxRetries - 1) throw err; // Re-throw on last attempt
      }
    }
  };

  // 🧠 GEMINI PARSER (Smart Paste)
  const parseWithGemini = async (text) => {
    const existingItemsContext = ingredients.map(i => 
      `Name: "${i.name}", Unit: "${i.unit || 'unit'}", Yield: ${i.yield_amount}`
    ).join('\n');

    const prompt = `You are an expert chef and data entry assistant for a South African Kota shop's Cost of Sales system.
Here is the CURRENT INVENTORY already in our database:
${existingItemsContext}

Parse the following NEW raw text notes from a receipt or notepad.
For each item in the new text, extract:
1. "name" (Clean, capitalized string)
2. "purchase_price" (Number)
3. "yield_amount" (Number) - Estimate the real-world usable yield. 
   - CRITICAL RULE: If the item already exists in the CURRENT INVENTORY, you MUST use the existing Yield and Unit unless the new text explicitly states a different quantity/unit.
   - If it's a new item: Estimate logically (e.g., 3kg Polony = 30 slices, 1 loaf bread = 4 portions, 1 pack viennas = 10 pieces). If you can't guess, use 1.
4. "unit" (String) - e.g., slice, portion, piece, kg, tsp, tbsp, unit.
5. "type" (String) - "ingredient" for food stock, "general" for expenses like gas, rent, electricity, wages.

Output ONLY a valid JSON array of objects. Do NOT include markdown formatting, backticks, or any other text. Just the raw JSON array.

NEW Raw text:
${text}`;

    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 } 
      })
    });

    const data = await response.json();
    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(textResponse);
  };

  // 🪄 AUTO-FIX EXISTING DATA (Bulletproof Gemini/Local)
  const autoFixExistingData = async () => {
    if (useGemini && geminiKey) {
      setIsFixing(true);
      haptics.light();
      try {
        const contextData = ingredients.map(i => ({ 
          id: i.id, 
          name: i.name, 
          current_unit: i.unit || 'unit', 
          current_yield: i.yield_amount, 
          price: i.purchase_price 
        }));
        
        const prompt = `You are an expert chef auditing a database. Look at this current inventory JSON list.
Fix any unrealistic yields or units based on standard restaurant prep (e.g., if Polony is 3kg, change yield to 30 and unit to "slice"; if bread is 1, change yield to 4 and unit to "portion").
Output ONLY a valid JSON array of objects with this EXACT structure:
[{"id": "existing-id-here", "fixed_yield": 30, "fixed_unit": "slice"}]
Do NOT include markdown formatting, backticks, or any other text. If an item is already correct, still include it with its current values.

CURRENT DATA:
${JSON.stringify(contextData)}`;

        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
        });
        
        const data = await response.json();
        let textResponse = data.candidates[0].content.parts[0].text;
        
        textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let fixedData;
        try {
          fixedData = JSON.parse(textResponse);
        } catch (parseError) {
          throw new Error("Gemini returned invalid JSON. Please try again.");
        }

        if (!Array.isArray(fixedData)) throw new Error("Gemini did not return an array.");

        let updateCount = 0;
        for (const item of fixedData) {
          if (item.id && item.fixed_yield !== undefined && item.fixed_unit) {
             const numYield = Number(item.fixed_yield);
             if (!isNaN(numYield)) {
               const { error: dbError } = await supabase.from('ingredients').update({
                 yield_amount: numYield,
                 unit: String(item.fixed_unit)
               }).eq('id', item.id);
               
               if (dbError) console.error("DB Update failed for", item.id, dbError);
               else updateCount++;
             }
          }
        }
        
        await loadData();
        haptics.success();
        showToast(`Gemini fixed ${updateCount} ingredients!`);
      } catch (err) {
        console.error("Auto-fix error:", err);
        showToast(`Failed: ${err.message}`);
      } finally {
        setIsFixing(false);
      }
    } else {
      // LOCAL FALLBACK (Keep existing logic)
      setIsFixing(true);
      haptics.light();
      let fixCount = 0;
      try {
        for (const ing of ingredients) {
          const nameLower = ing.name.toLowerCase();
          let matchedRule = null;
          for (const key in AI_YIELD_MAP) {
            if (nameLower.includes(key)) { matchedRule = AI_YIELD_MAP[key]; break; }
          }
          if (matchedRule) {
            const currentYield = Number(ing.yield_amount);
            const currentUnit = ing.unit || 'unit';
            if (currentYield !== matchedRule.yield || currentUnit !== matchedRule.unit) {
              await supabase.from('ingredients').update({
                yield_amount: matchedRule.yield,
                unit: matchedRule.unit
              }).eq('id', ing.id);
              fixCount++;
            }
          }
        }
        if (fixCount > 0) {
          await loadData();
          haptics.success();
          showToast(`Local Brain fixed ${fixCount} ingredients!`);
        } else {
          showToast('All ingredients already look perfect!');
        }
      } catch (err) {
        console.error(err);
        showToast('Local Auto-fix failed.');
      } finally {
        setIsFixing(false);
      }
    }
  };

  // SMART PARSER ENTRY POINT
  const parseText = async () => {
    setIsParsing(true);
    
    try {
      if (useGemini && geminiKey) {
        const results = await parseWithGemini(bulkText);
        setParsedPreview(results);
      } else {
        // Local Regex Dictionary Fallback
        const lines = bulkText.split('\n');
        const results = [];

        lines.forEach(line => {
          let clean = line.trim();
          if (!clean) return;

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

          const isGeneralExpense = /gas|rent|wage|electric|water|packaging|box|poly|cleaning|repair|salary|transport|delivery|maintenance|fuel|petrol|oil|cooking oil/i.test(clean);
          let extractedType = isGeneralExpense ? 'general' : 'ingredient';
          
          let extractedYield = 1;
          let extractedUnit = 'unit';
          let aiAdjusted = false;

          let extractedName = clean
            .replace(/(?:R|=)\s*[\d.,]+(?:\s*-\s*(?:R)?\s*[\d.,]+)?/gi, '')
            .replace(/\d+(?:[.,]\d+)?\s*(?:x|kg|g|l|L|patties|slices|pieces|loaf)/gi, '')
            .replace(/\d+/g, '')
            .replace(/[=.-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (extractedType === 'ingredient') {
            const nameLower = extractedName.toLowerCase();
            
            const existingDbItem = ingredients.find(i => i.name.toLowerCase() === nameLower);
            if (existingDbItem) {
              extractedYield = existingDbItem.yield_amount;
              extractedUnit = existingDbItem.unit;
            } else {
              let aiMatch = null;
              for (const key in AI_YIELD_MAP) {
                if (nameLower.includes(key)) {
                  aiMatch = AI_YIELD_MAP[key];
                  break;
                }
              }
              if (aiMatch) {
                extractedYield = aiMatch.yield;
                extractedUnit = aiMatch.unit;
                aiAdjusted = true;
              }
            }
          }

          if (extractedPrice > 0 && extractedName.length > 1) {
            results.push({ 
              name: extractedName, purchase_price: extractedPrice, yield_amount: extractedYield, unit: extractedUnit, type: extractedType, aiAdjusted
            });
          }
        });
        setParsedPreview(results);
      }
    } catch (err) {
      console.error(err);
      showToast(`AI Error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    setIsSavingBulk(true);
    haptics.success();
    
    const ingredientsToSave = parsedPreview.filter(p => p.type === 'ingredient');
    const expensesToSave = parsedPreview.filter(p => p.type === 'general');

    try {
      if (ingredientsToSave.length > 0) {
        await addBulkIngredients(ingredientsToSave);
        await supabase.from('purchase_logs').insert(ingredientsToSave.map(p => ({
          ingredient_name: p.name, purchase_price: p.purchase_price, yield_amount: p.yield_amount, unit: p.unit
        })));
      }

      if (expensesToSave.length > 0) {
        await supabase.from('expenses').insert(expensesToSave.map(e => ({
          description: e.name, amount: e.purchase_price
        })));
      }

      setBulkText('');
      setParsedPreview([]);
      loadData();
      showToast('Successfully saved!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save items');
    } finally {
      setIsSavingBulk(false);
    }
  };

  return (
    <div className="admin-cos-page" style={{ padding: '24px 20px', minHeight: '100dvh', background: 'var(--ck-cream)', paddingBottom: '100px' }}>
      
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--ck-brand-deep)', color: 'white', padding: '12px 24px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
          >
            <AlertCircle size={18} /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Finance</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Cost of Sales</h1>
        </div>
        
        {ingredients.length > 0 && !parsedPreview.length && (
          <button 
            onClick={autoFixExistingData} 
            disabled={isFixing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {isFixing ? <RefreshCw size={16} className="spin" /> : <Wand2 size={16} />} 
            {isFixing ? 'Fixing...' : (useGemini ? 'Gemini Auto-Fix Data' : 'Local Auto-Fix Data')}
          </button>
        )}
      </header>

      {!parsedPreview.length && (
        <div style={{ background: 'linear-gradient(135deg, #1e5f9c, var(--ck-brand-deep))', borderRadius: '16px', padding: '16px', marginBottom: '24px', color: 'white' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
              {useGemini ? <Sparkles size={18} /> : <ClipboardPaste size={18} />} 
              {useGemini ? 'Gemini Smart Paste' : 'Local Smart Paste'}
            </h3>
            
            <button 
              onClick={() => setShowAiConfig(!showAiConfig)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Settings size={12} /> AI Config
            </button>
          </div>

          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 12px', lineHeight: 1.4 }}>
            {useGemini 
              ? "Paste any text. Gemini reads your current inventory and aligns new items to your existing setup." 
              : "Paste raw notes. The Local Brain matches keywords to calculate portions."}
          </p>

          <AnimatePresence>
            {showAiConfig && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>Use Gemini AI</span>
                  <button 
                    onClick={() => saveAiSettings(geminiKey, !useGemini)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {useGemini ? <ToggleRight size={36} color="var(--ck-green)" /> : <ToggleLeft size={36} color="#888" />}
                  </button>
                </div>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>
                    <Key size={12} /> API Key
                  </span>
                  <input 
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey} 
                    onChange={(e) => saveAiSettings(e.target.value, useGemini)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} 
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Gas cylinder 9kg=R290&#10;Polony 3kg = R100&#10;Bread = R14" style={{ width: '100%', height: '100px', padding:'12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontFamily: 'monospace', outline: 'none', background:'rgba(255,255,255,0.9)', color: 'var(--ck-ink)', boxSizing: 'border-box' }} />
          
          <button onClick={parseText} disabled={!bulkText.trim() || isParsing} style={{ width: '100%', padding: '12px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            {isParsing ? (useGemini ? 'Gemini is reading...' : 'Deciphering...') : 'Decipher Notes'} <Wand2 size={14} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {parsedPreview.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: 'white', borderRadius: '24px', padding: '24px', marginBottom: '24px', border: '1px solid var(--ck-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-green)' }}><CheckCircle2 size={18} /> Auto-Sorted Preview</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
              
              {parsedPreview.filter(p => p.type === 'ingredient').length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>Stock / Ingredients</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {parsedPreview.map((item, i) => item.type === 'ingredient' && (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '12px', position: 'relative' }}>
                        
                        {item.aiAdjusted && (
                          <div style={{ position: 'absolute', top: '-8px', right: '12px', background: 'var(--ck-warm)', color: 'var(--ck-ink)', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <Wand2 size={10} /> AI Adjusted
                          </div>
                        )}

                        <input value={item.name} onChange={(e) => { const n = [...parsedPreview]; n[i].name = e.target.value; setParsedPreview(n); }} placeholder="Name" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box', marginTop: item.aiAdjusted ? '8px' : 0 }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="number" value={item.purchase_price} onChange={(e) => { const n = [...parsedPreview]; n[i].purchase_price = Number(e.target.value); setParsedPreview(n); }} placeholder="Price" style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box' }} />
                          <input type="number" value={item.yield_amount} onChange={(e) => { const n = [...parsedPreview]; n[i].yield_amount = Number(e.target.value); setParsedPreview(n); }} placeholder="Yield" style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box' }} />
                          <input value={item.unit} onChange={(e) => { const n = [...parsedPreview]; n[i].unit = e.target.value; setParsedPreview(n); }} placeholder="Unit" style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>
                        <button onClick={() => setParsedPreview(parsedPreview.filter((_, idx) => idx !== i))} style={{padding: '8px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedPreview.filter(p => p.type === 'general').length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-achaar-red)', textTransform: 'uppercase', marginBottom: '8px' }}>General Bills (Expenses)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {parsedPreview.map((item, i) => item.type === 'general' && (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(229, 57, 53, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(229, 57, 53, 0.1)' }}>
                        <input value={item.name} onChange={(e) => { const n = [...parsedPreview]; n[i].name = e.target.value; setParsedPreview(n); }} placeholder="Description" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box' }} />
                        <input type="number" value={item.purchase_price} onChange={(e) => { const n = [...parsedPreview]; n[i].purchase_price = Number(e.target.value); setParsedPreview(n); }} placeholder="Amount" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ck-border)', fontSize: '13px', boxSizing: 'border-box' }} />
                        <button onClick={() => setParsedPreview(parsedPreview.filter((_, idx) => idx !== i))} style={{padding: '8px', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => setParsedPreview([])} style={{ flex: 1, padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Cancel</button>
              <button onClick={handleBulkSubmit} disabled={isSavingBulk} style={{ flex: 2, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800 }}>{isSavingBulk ? 'Saving...' : 'Confirm & Save All'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!parsedPreview.length && (
        <>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Current Ingredients ({ingredients.length})
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>Loading...</div>
          ) : ingredients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)', background: 'white', borderRadius: '20px', border: '1px dashed var(--ck-border)' }}>
              No ingredients added yet.<br/>Tap the + button to start.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {ingredients.map(ing => {
                  const safeYield = Number(ing.yield_amount) || 1;
                  const costPerUnit = (Number(ing.purchase_price) / safeYield);
                  return (
                    <motion.div 
                      key={ing.id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      style={{ background: 'white', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--ck-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}
                    >
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: 'var(--ck-ink)' }}>{ing.name}</h4>
                        <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>R{ing.purchase_price} for {ing.yield_amount} {ing.unit}s</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right', background: 'var(--ck-cream)', padding: '8px 12px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ck-ink-soft)', textTransform: 'uppercase' }}>Cost / {ing.unit || 'unit'}</div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>R {costPerUnit.toFixed(2)}</div>
                        </div>
                        
                        <button onClick={() => { haptics.light(); setEditingItem(ing); }} style={{ background: 'rgba(15,46,74,0.05)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--ck-brand-deep)' }}>
                          <Pencil size={18} />
                        </button>

                        <button onClick={() => { haptics.light(); setDeletingId(ing.id); }} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--ck-achaar-red)' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {!parsedPreview.length && (
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          style={{ 
            position: 'fixed', bottom: '90px', right: '20px', 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'var(--ck-brand-deep)', color: 'white', border: 'none', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 8px 25px rgba(15,46,74,0.3)', cursor: 'pointer', zIndex: 90 
          }}
        >
          <Plus size={32} />
        </motion.button>
      )}

      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setEditingItem(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 1000, maxWidth: '600px', margin: '0 auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--ck-ink)' }}>Edit Ingredient</h3>
                <button onClick={() => setEditingItem(null)} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} color="var(--ck-ink-soft)" /></button>
              </div>

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Name</label>
                  <input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Price (R)</label>
                    <input type="number" step="0.01" value={editingItem.purchase_price} onChange={(e) => setEditingItem({ ...editingItem, purchase_price: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Yield</label>
                    <input type="number" step="0.01" value={editingItem.yield_amount} onChange={(e) => setEditingItem({ ...editingItem, yield_amount: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>Unit</label>
                    <input value={editingItem.unit || 'unit'} onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" disabled={isSavingEdit} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {isSavingEdit ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setDeletingId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 1000, maxWidth: '600px', margin: '0 auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--ck-ink)' }}>Delete Ingredient?</h3>
                <button onClick={() => setDeletingId(null)} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} color="var(--ck-ink-soft)" /></button>
              </div>
              <p style={{ color: 'var(--ck-ink-soft)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>Are you sure you want to remove this ingredient? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setDeletingId(null)} style={{ flex: 1, padding: '14px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Cancel</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '14px', background: '#E53935', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800 }}>Delete</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <AddCOSModal 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => { setIsModalOpen(false); loadData(); }} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}