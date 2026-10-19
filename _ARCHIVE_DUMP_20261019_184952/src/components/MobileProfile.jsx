import { useState } from 'react';
import { User, Volume2, Sparkles, Zap, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefs } from '../context/PreferencesContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useHaptics } from '../hooks/useHaptics';
import { playPop } from '../lib/chime';
import AuthModal from './mobile/AuthModal';

const Toggle = ({ isOn, onToggle }) => (
  <div onClick={onToggle} style={{ width: '50px', height: '30px', borderRadius: '15px', background: isOn ? 'var(--ck-brand-deep)' : '#e2e8f0', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', justifyContent: isOn ? 'flex-end' : 'flex-start', transition: 'background 0.2s ease' }}>
    <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

export default function MobileProfile() {
  const { prefs, togglePref } = usePrefs();
  const { store } = useStore();
  const { user, profile, signOut } = useAuth();
  const haptics = useHaptics();
  const [authOpen, setAuthOpen] = useState(false);

  const storeName = store?.branch || store?.name || 'CeeKay';
  const points = profile?.loyalty_points || 0;
  const nextReward = 5;
  const progress = Math.min((points / nextReward) * 100, 100);

  const handleToggle = (key) => {
    haptics.light();
    if ((key === 'sound' && !prefs.sound) || (key !== 'sound' && prefs.sound)) playPop();
    togglePref(key);
  };

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--ck-cream)', minHeight: '100dvh' }}>
      
      {/* 1. Profile Card */}
      <div style={{ padding: '24px 20px 16px' }}>
        {!user ? (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.light(); setAuthOpen(true); }} 
            style={{ background: 'linear-gradient(135deg, var(--ck-brand-deep), #1e5f9c)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', boxShadow: '0 10px 30px rgba(15, 46, 74, 0.2)', cursor: 'pointer', color: 'white', position: 'relative', overflow: 'hidden' }}
          >
            {/* Decorative background circle */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={28} color="white" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: '0 0 4px', color: 'white' }}>Join Kota Rewards</h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Sign in to start earning free food.</p>
              </div>
            </div>
            <button style={{ width: '100%', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 800, fontSize: '15px', marginTop: '8px', zIndex: 1 }}>
              Sign In / Create Account
            </button>
          </motion.div>
        ) : (
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--ck-brand-light, #e0f2fe)', color: 'var(--ck-brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', margin: '0 0 4px', color: 'var(--ck-ink)' }}>
                {profile?.full_name || user.email.split('@')[0]}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>
                {user.email}
              </p>
            </div>
            <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: 'var(--ck-achaar-red)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* 2. Kota Rewards Card (Live Data) */}
      {user && (
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #B58B2C, #8F6B1B)', borderRadius: '24px', padding: '24px', color: 'white', boxShadow: '0 10px 30px rgba(143, 107, 27, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '22px', margin: 0 }}>Kota Rewards</h3>
              <Sparkles size={24} color="rgba(255,255,255,0.8)" />
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>You have <strong>{points}</strong> points.</p>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: 'white', borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{nextReward - points} more to a free Kota!</span>
              <button disabled={points < nextReward} style={{ background: points >= nextReward ? 'white' : 'rgba(255,255,255,0.3)', color: points >= nextReward ? '#8F6B1B' : 'white', padding: '8px 16px', borderRadius: '99px', fontWeight: 800, border: 'none' }}>
                {points >= nextReward ? 'Claim Free Kota' : 'Keep Eating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Preferences */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>PREFERENCES</div>
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Volume2 size={18} /></div>
              <div><div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Sound effects</div></div>
            </div>
            <Toggle isOn={prefs.sound} onToggle={() => handleToggle('sound')} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Zap size={18} /></div>
              <div><div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Animations</div></div>
            </div>
            <Toggle isOn={prefs.animations !== false} onToggle={() => handleToggle('animations')} />
          </div>

        </div>
      </div>

      {/* 4. About */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>ABOUT</div>
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>App Version</div>
            <div style={{ fontSize: '14px', color: 'var(--ck-ink-soft)' }}>{__APP_VERSION__} (Native)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Store</div>
            <div style={{ fontSize: '14px', color: 'var(--ck-ink-soft)' }}>{storeName}</div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}