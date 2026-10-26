 
import React from 'react';
import { Store } from 'lucide-react';

export default function StoreSelector() {
  // Currently gated per handover notes. Hardcoded to default store.
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ck-cream)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--ck-brand-deep)' }}>
      <Store size={14} />
      Benoni
    </div>
  );
}
