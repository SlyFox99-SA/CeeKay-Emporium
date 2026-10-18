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
                <button key={pref.id} onClick={() => onToggle(pref)} style={{ padding: '10px 16px', borderRadius: '99px', border: `1px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-brand-deep)' : 'white', color: isSelected ? 'white' : 'var(--ck-ink)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pref.color_hex && pref.color_hex !== 'transparent' && (
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: pref.color_hex, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                  )}
                  {isSelected && <Check size={14} />} {pref.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}