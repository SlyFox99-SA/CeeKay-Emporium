 
import { Leaf, Flame, Clock, MapPin } from 'lucide-react';

const ITEMS = [
  { icon: Leaf,  label: 'Real ingredients',  sub: 'No shortcuts' },
  { icon: Flame, label: 'Cooked to order',   sub: 'Never pre-made' },
  { icon: Clock, label: 'Ready in ~15 min',  sub: 'Fresh & fast' },
  { icon: MapPin, label: 'Benoni, Gauteng',  sub: 'Since 2021' },
];

export default function TrustStrip() {
  return (
    <section className="trust-strip" data-reveal>
      {ITEMS.map(({ icon: Icon, label, sub }, i) => (
        <div key={i} className="trust-item">
          <span className="trust-icon"><Icon size={18} strokeWidth={1.8} /></span>
          <div className="trust-text">
            <div className="trust-label">{label}</div>
            <div className="trust-sub">{sub}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

