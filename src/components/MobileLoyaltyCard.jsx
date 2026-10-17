import { useEffect, useState } from 'react';
import { Sandwich, Gift, CheckCircle2, X } from 'lucide-react';
import { getLoyaltyProgress, redeemLoyalty } from '../services/customerService';
import { usePrefs } from '../context/PreferencesContext';
import { burstConfetti } from '../lib/confetti';
import { playSuccess } from '../lib/chime';

export default function MobileLoyaltyCard() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const { prefs } = usePrefs();

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
      await load(); // refresh count
      setShowReward(false);
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
    } catch (e) {
      alert("Error redeeming reward");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || !progress) return null;

  const { slotsFilled, threshold, rewardReady } = progress;
  const slots = Array.from({ length: threshold });

  return (
    <>
      <div className={`loyalty-card ${rewardReady ? 'unlocked' : ''}`}>
        <div className="loyalty-head">
          <div className="loyalty-title">
            {rewardReady ? 'Reward Unlocked!' : 'Kota Rewards'}
          </div>
          <div className="loyalty-sub">
            {rewardReady 
              ? 'You have a free kota waiting.' 
              : `Buy ${threshold - slotsFilled} more kotas for a free one.`}
          </div>
        </div>

        <div className="loyalty-slots">
          {slots.map((_, i) => (
            <div key={i} className={`loyalty-slot ${i < slotsFilled ? 'filled' : ''}`}>
              <Sandwich size={20} />
            </div>
          ))}
        </div>

        {rewardReady && (
          <button className="loyalty-redeem-btn" onClick={() => setShowReward(true)}>
            <Gift size={16} /> Claim Free Kota
          </button>
        )}
      </div>

      {/* Reward Modal */}
      {showReward && (
        <div className="loyalty-modal-overlay" onClick={() => setShowReward(false)}>
          <div className="loyalty-modal" onClick={e => e.stopPropagation()}>
            <button className="loyalty-modal-close" onClick={() => setShowReward(false)}>
              <X size={18} />
            </button>
            <div className="loyalty-modal-icon">
              <Gift size={40} />
            </div>
            <h2 className="loyalty-modal-title">Free Kota!</h2>
            <p className="loyalty-modal-sub">
              Show this screen to the cashier to claim your free kota.
            </p>
            <button 
              className="loyalty-modal-btn" 
              onClick={handleRedeem}
              disabled={redeeming}
            >
              {redeeming ? 'Redeeming...' : 'Mark as Redeemed'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}