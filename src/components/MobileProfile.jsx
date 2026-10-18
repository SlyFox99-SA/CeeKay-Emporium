import { User, Volume2, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefs } from '../context/PreferencesContext';
import { useStore } from '../context/StoreContext';
import { useHaptics } from '../hooks/useHaptics';
import { playPop } from '../lib/chime';

const Toggle = ({ isOn, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      style={{
        width: '50px', height: '30px', borderRadius: '15px',
        background: isOn ? 'var(--ck-brand-deep)' : '#e2e8f0',
        display: 'flex', alignItems: 'center', padding: '2px',
        cursor: 'pointer', justifyContent: isOn ? 'flex-end' : 'flex-start',
        transition: 'background 0.2s ease'
      }}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

export default function MobileProfile() {
  const { prefs, togglePref } = usePrefs();
  const { store } = useStore();
  const haptics = useHaptics();

  const storeName = store?.branch || store?.name || 'Benoni';

  const handleToggle = (key) => {
    haptics.light();
    // Only play sound if we are turning sound ON, or if we are toggling a different pref while sound is ON
    if ((key === 'sound' && !prefs.sound) || (key !== 'sound' && prefs.sound)) {
      playPop();
    }
    togglePref(key);
  };

  return (
    <div className="m-profile-page" style={{ paddingBottom: '100px', background: 'var(--ck-cream)', minHeight: '100dvh' }}>
      
      {/* 1. Profile Card */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ 
          background: 'white', borderRadius: '24px', padding: '24px', 
          display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '50%', 
            background: 'var(--ck-brand-light, #e0f2fe)', color: 'var(--ck-brand-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <User size={28} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', margin: '0 0 4px', color: 'var(--ck-ink)' }}>
              Guest User
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>
              No phone number saved
            </p>
          </div>
        </div>
      </div>

      {/* 2. Preferences Section */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>
          PREFERENCES
        </div>
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Volume2 size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Sound effects</div>
                <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)' }}>Playing taps, pops and celebration chimes</div>
              </div>
            </div>
            <Toggle isOn={prefs.sound} onToggle={() => handleToggle('sound')} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Sparkles size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Celebration</div>
                <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)' }}>Confetti when you place an order</div>
              </div>
            </div>
            <Toggle isOn={prefs.confetti} onToggle={() => handleToggle('confetti')} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'var(--ck-cream)', borderRadius: '12px', color: 'var(--ck-ink-soft)' }}><Zap size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ck-ink)' }}>Animations</div>
                <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)' }}>Smooth motion throughout</div>
              </div>
            </div>
            <Toggle isOn={prefs.animations !== false} onToggle={() => handleToggle('animations')} />
          </div>

        </div>
      </div>

      {/* 3. About Section */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-ink-soft)', letterSpacing: '0.05em', marginBottom: '12px', paddingLeft: '4px' }}>
          ABOUT
        </div>
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

    </div>
  );
}