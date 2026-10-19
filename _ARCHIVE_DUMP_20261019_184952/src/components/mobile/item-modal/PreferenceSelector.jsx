import { Check } from 'lucide-react';

export default function PreferenceSelector({ prefs, selectedMods, onToggle }) {
  if (!prefs || prefs.length === 0) return null;
  const groups = Array.from(new Set(prefs.map(p => p.group_name)));

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ height: '1px', background: 'var(--ck-border)', margin: '24px 0' }} />
      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ck-ink)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customize</div>
      
      {groups.map(group => (
        <div key={group} style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>{group}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {prefs.filter(p => p.group_name === group).map(pref => {
              const isSelected = selectedMods.some(m => m.id === pref.id);
              return (
                <button key={pref.id} onClick={() => onToggle(pref)} style={{ padding: '10px 16px', borderRadius: '99px', border: `1px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-brand-deep)' : 'white', color: isSelected ? 'white' : 'var(--ck-ink)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s, border 0.2s' }}>
                  {/* 1. The Color Dot (Always rendered, just hidden if none) */}
                  <span style={{ 
                    width: '12px', height: '12px', borderRadius: '50%', 
                    backgroundColor: pref.color_hex || 'transparent', 
                    border: pref.color_hex && pref.color_hex !== 'transparent' ? '1px solid rgba(0,0,0,0.1)' : 'none', 
                    display: pref.color_hex && pref.color_hex !== 'transparent' ? 'inline-block' : 'none' 
                  }} />
                  
                  {/* 2. The Checkmark (Reserves exactly 14px of space, invisible when not selected) */}
                  <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isSelected ? 1 : 0 }}>
                    <Check size={14} />
                  </div>
                  
                  {pref.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}