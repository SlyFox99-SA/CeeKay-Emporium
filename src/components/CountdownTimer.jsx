 
import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export default function CountdownTimer({ createdAt, prepTimeMinutes = 12 }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!createdAt) return;

    const calculateTime = () => {
      const created = new Date(createdAt).getTime();
      const target = created + prepTimeMinutes * 60 * 1000;
      const now = new Date().getTime();
      setTimeLeft(target - now);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, prepTimeMinutes]);

  if (timeLeft === null) return null;

  if (timeLeft <= 0) {
    const overdueMins = Math.abs(Math.floor(timeLeft / 60000));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ck-achaar-red)', fontWeight: 800, fontSize: '13px', background: 'rgba(229, 57, 53, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
        <AlertCircle size={14} /> +{overdueMins}m overdue
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = minutes < 3;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isUrgent ? 'var(--ck-achaar-red)' : 'var(--ck-brand-deep)', fontWeight: 700, fontSize: '13px' }}>
      <Clock size={14} /> {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
