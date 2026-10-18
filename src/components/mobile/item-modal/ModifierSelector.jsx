import { Minus, Plus, Lightbulb } from 'lucide-react';

export default function ModifierSelector({ extras, selectedMods, onUpdate }) {
  if (!extras || extras.length === 0) return null;
  const popularExtra = extras.find(e => e.is_popular);

  return (
    <div style={{ marginBottom: '24px' }}>
      {popularExtra && (
        <div style={{ background: '#FFF4E5', borderLeft: '4px solid var(--ck-warm)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Lightbulb size={20} color="var(--ck-brand-deep)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-charcoal)' }}>Most people add <strong>{popularExtra.name}</strong> to this Kota!</span>
        </div>
      )}
      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Make it a Beast</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {extras.map(mod => {
          const selected = selectedMods.find(m => m.id === mod.id);
          const currentQty = selected ? selected.qty : 0;
          return (
            <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${currentQty > 0 ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: currentQty > 0 ? 'var(--ck-cream)' : 'white' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ck-ink)', fontSize: '14px' }}>{mod.name}</div>
                <div style={{ fontWeight: 800, color: 'var(--ck-brand-deep)', fontSize: '13px', marginTop: '2px' }}>+ R{mod.sell_price}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentQty > 0 && (
                  <>
                    <button onClick={() => onUpdate(mod, 'remove')} style={{ background: 'white', border: '1px solid var(--ck-border)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 800, width: '16px', textAlign: 'center' }}>{currentQty}</span>
                  </>
                )}
                <button onClick={() => onUpdate(mod, 'add')} disabled={currentQty >= 2} style={{ background: currentQty >= 2 ? 'var(--ck-border)' : 'var(--ck-brand-deep)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Plus size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}