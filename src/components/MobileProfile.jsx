import { useState } from 'react';
import { User, Volume2, Sparkles, Zap, LogOut, Shield, Info, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefs } from '../context/PreferencesContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useHaptics } from '../hooks/useHaptics';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { playPop } from '../lib/chime';
import AuthModal from './mobile/AuthModal';

const Toggle = ({ isOn, onToggle, disabled }) => (
  <motion.div 
    onClick={disabled ? undefined : onToggle} 
    style={{ 
      width: '52px', height: '32px', borderRadius: '16px', 
      background: isOn ? 'var(--ck-brand-deep)' : '#e2e8f0', 
      display: 'flex', alignItems: 'center', padding: '2px', 
      cursor: disabled ? 'not-allowed' : 'pointer', 
      justifyContent: isOn ? 'flex-end' : 'flex-start',
      opacity: disabled ? 0.5 : 1
    }}
  >
    <motion.div 
      layout transition={{ type: "spring", stiffness: 700, damping: 30 }} 
      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} 
    />
  </motion.div>
);

export default function MobileProfile() {
  const { prefs, togglePref } = usePrefs();
  const { store } = useStore();
  const { user, profile, signOut } = useAuth();
  const { isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const haptics = useHaptics();
  const [authOpen, setAuthOpen] = useState(false);

  const storeName = store?.branch || store?.name || 'CeeKay';
  const points = profile?.loyalty_points || 0;
  const nextReward = 5;
  const progress = Math.min((points / nextReward) * 100, 100);
  const rawName = profile?.full_name || user?.email || 'Guest';
  const initial = rawName.charAt(0).toUpperCase();

  const handleToggle = (key) => {
    haptics.light();
    if ((key === 'sound' && !prefs.sound) || (key !== 'sound' && prefs.sound)) playPop();
    togglePref(key);
  };

  const handlePushToggle = () => {
    haptics.light();
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <div style={{ paddingBottom: '120px', background: 'var(--ck-cream)', minHeight: '100dvh' }}>
      
      {/* 1. User Account Card */}
      <div style={{ padding: '24px 20px 16px' }}>
        {!user ? (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.light(); setAuthOpen(true); }} 
            style={{ background: 'linear-gradient(135deg, var(--ck-brand-deep), #1e5f9c)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', boxShadow: '0 12px 30px rgba(15, 46, 74, 0.25)', cursor: 'pointer', color: 'white', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="white" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: '0 0 4px', color: 'white' }}>Join Kota Rewards</h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Sign in to earn free food.</p>
              </div>
            </div>
            <button style={{ width: '100%', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '15px', marginTop: '8px', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              Sign In / Create Account
            </button>
          </motion.div>
        ) : (
          <div style={{ background: 'white', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--ck-brand), var(--ck-brand-deep))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, fontFamily: 'var(--ck-font-serif)', boxShadow: '0 4px 12px rgba(15,46,74,0.2)' }}>
              {initial}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', margin: '0 0 4px', color: 'var(--ck-ink)' }}>
                {profile?.full_name || user.email.split('@')[0]}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>{user.email}</p>
            </div>
            <button onClick={signOut} style={{ background: 'rgba(229, 57, 53, 0.1)', border: 'none', color: '#E53935', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Kota Rewards Card */}
      {user && (
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #D4AF37, #AA7C11)', borderRadius: '24px', padding: '24px', color: 'white', boxShadow: '0 12px 30px rgba(170, 124, 17, 0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '22px', margin: 0 }}>Kota Rewards</h3>
              <Sparkles size={24} color="rgba(255,255,255,0.9)" />
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'rgba(255,255,255,0.9)', position: 'relative', zIndex: 1 }}>You have <strong>{points}</strong> points.</p>
            
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: 'white', borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{nextReward - points} more to a free Kota!</span>
              <button disabled={points < nextReward} style={{ background: points >= nextReward ? 'white' : 'rgba(255,255,255,0.3)', color: points >= nextReward ? '#AA7C11' : 'white', padding: '8px 16px', borderRadius: '99px', fontWeight: 800, border: 'none', opacity: points >= nextReward ? 1 : 0.7 }}>
                {points >= nextReward ? 'Claim Free Kota' : 'Keep Eating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Preferences */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>PREFERENCES</div>
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
          
          {/* Push Notifications Toggle */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-brand-deep)' }}><Bell size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ck-ink)' }}>Push Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>Get alerted when food is ready</div>
                </div>
              </div>
              <Toggle isOn={isSubscribed} onToggle={handlePushToggle} disabled={pushLoading} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-brand-deep)' }}><Volume2 size={18} /></div>
              <div><div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ck-ink)' }}>Sound Effects</div></div>
            </div>
            <Toggle isOn={prefs.sound} onToggle={() => handleToggle('sound')} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-brand-deep)' }}><Zap size={18} /></div>
              <div><div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ck-ink)' }}>Animations</div></div>
            </div>
            <Toggle isOn={prefs.animations !== false} onToggle={() => handleToggle('animations')} />
          </div>

        </div>
      </div>

      {/* 4. About */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>ABOUT</div>
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Info size={18} /></div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ck-ink)' }}>App Version</div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', fontWeight: 500 }}>1.0.0</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Shield size={18} /></div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ck-ink)' }}>Store</div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', fontWeight: 500 }}>{storeName}</div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}