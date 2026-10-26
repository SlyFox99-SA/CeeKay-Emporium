/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Sandwich, Gift, X, Sparkles } from 'lucide-react';
import { getLoyaltyProgress, redeemLoyalty } from '../services/customerService';
import { usePrefs } from '../context/PreferencesContext';
import { burstConfetti } from '../lib/confetti';
import { playSuccess } from '../lib/chime';
import { useHaptics } from '../hooks/useHaptics';

export default function MobileLoyaltyCard() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const { prefs } = usePrefs();
  const haptics = useHaptics();

  const load = async () => {
    const p = await getLoyaltyProgress();
    setProgress(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await redeemLoyalty();
      await load();
      setShowReward(false);
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
      haptics.success();
    } catch (e) {
      console.error("Error redeeming reward");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || !progress) return null;

  const { slotsFilled, threshold, rewardReady } = progress;
  const percent = Math.min(100, (slotsFilled / threshold) * 100);

  return (
    <>
      <div className={`m-loyalty-card ${rewardReady ? 'unlocked' : ''}`}>
        {/* Glow Effect */}
        <div className="m-loyalty-glow" />
        
        <div className="m-loyalty-content">
          <div className="m-loyalty-header">
            <div>
              <div className="m-loyalty-title">Kota Rewards</div>
              <div className="m-loyalty-sub">
                {rewardReady ? 'You have a free kota!' : `Buy ${threshold - slotsFilled} more for a free one`}
              </div>
            </div>
            <Sparkles size={24} className={rewardReady ? 'text-warm' : 'text-muted'} />
          </div>

          {/* Progress Bar */}
          <div className="m-loyalty-bar-wrap">
            <div className="m-loyalty-bar" style={{ width: `${percent}%` }} />
          </div>

          {/* Stamps */}
          <div className="m-loyalty-stamps">
            {Array.from({ length: threshold }).map((_, i) => (
              <div key={i} className={`m-stamp ${i < slotsFilled ? 'filled' : ''}`}>
                <Sandwich size={18} />
              </div>
            ))}
          </div>

          {rewardReady && (
            <button className="m-loyalty-btn" onClick={() => setShowReward(true)}>
              <Gift size={18} /> Claim Free Kota
            </button>
          )}
        </div>
      </div>

      {/* Redeem Modal */}
      {showReward && (
        <div className="m-modal-overlay" onClick={() => setShowReward(false)} style={{ zIndex: 9999 }}>
          <div className="m-modal-sheet" onClick={e => e.stopPropagation()} style={{ height: 'auto', borderRadius: '24px 24px 0 0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="m-loyalty-success">
              <button className="m-modal-close" style={{ position: 'absolute', top: 16, right: 16 }} onClick={() => setShowReward(false)}>
                <X size={18} />
              </button>
              <div className="m-success-icon" style={{ background: 'var(--ck-warm)', color: 'var(--ck-charcoal)' }}>
                <Gift size={40} />
              </div>
              <h2>Free Kota!</h2>
              <p>Show this screen to the cashier to claim your reward.</p>
              <button className="m-cart-primary-btn" onClick={handleRedeem} disabled={redeeming} style={{ marginTop: 24 }}>
                {redeeming ? 'Redeeming...' : 'Mark as Redeemed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
