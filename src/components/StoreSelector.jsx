import { useEffect } from 'react';
import { Sandwich } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import CKMark from './CKMark';

export default function StoreSelector() {
  const { stores, selectStore, store } = useStore();
  const liveStores = stores.filter(s => s.status !== 'coming-soon');

  useEffect(() => {
    if (!store && liveStores.length === 1) {
      selectStore(liveStores[0].id);
    }
  }, [store, liveStores, selectStore]);

  if (store || liveStores.length <= 1) return null;

  return (
    <div className="store-overlay">
      <div className="store-modal">
        <div className="store-modal-head">
          <span className="store-modal-mark"><CKMark size={56} /></span>
          <h2>Choose your store</h2>
          <p>Pick the CeeKay Emporium closest to you.</p>
        </div>

        <div className="store-list">
          {stores.map(s => {
            const disabled = s.status === 'coming-soon';
            return (
              <button
                key={s.id}
                className={`store-card ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && selectStore(s.id)}
                disabled={disabled}
              >
                <div className="store-card-top">
                  <span className="store-branch">{s.branch}</span>
                  <span className={`store-status ${s.status}`}>
                    {s.status === 'open' ? '● Open' : s.status === 'coming-soon' ? '◌ Coming soon' : '○ Closed'}
                  </span>
                </div>
                <div className="store-address">{s.address}</div>
                <div className="store-hours">{s.hoursLabel}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}