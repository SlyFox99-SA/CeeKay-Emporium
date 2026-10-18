import { Store, ChevronDown } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function StoreSelector({ selectedStore, onChange }) {
  const { stores } = useStore();

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        background: 'var(--ck-surface)', border: '1px solid var(--ck-border)', 
        borderRadius: '12px', padding: '8px 12px', cursor: 'pointer' 
      }}>
        <Store size={16} color="var(--ck-brand-deep)" />
        <select 
          value={selectedStore}
          onChange={(e) => onChange(e.target.value)}
          style={{ 
            appearance: 'none', background: 'transparent', border: 'none', 
            outline: 'none', fontFamily: 'inherit', fontWeight: 600, 
            fontSize: '14px', color: 'var(--ck-ink)', paddingRight: '16px', cursor: 'pointer'
          }}
        >
          <option value="all">All Branches</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.branch || s.name || 'Unnamed Branch'}</option>
          ))}
        </select>
        <ChevronDown size={14} color="var(--ck-ink-soft)" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}