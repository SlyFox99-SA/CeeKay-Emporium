import { useEffect, useState } from 'react';
import { Settings2, X, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';
import { usePrefs } from '../context/PreferencesContext';

export default function Preferences() {
  const { prefs, setPref } = usePrefs();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const Row = ({ icon: Icon, label, sub, value, onChange }) => (
    <div className="pref-row">
      <span className="pref-row-icon"><Icon size={16} strokeWidth={2} /></span>
      <div className="pref-row-text">
        <div className="pref-row-label">{label}</div>
        <div className="pref-row-sub">{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`pref-toggle ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="pref-toggle-knob" />
      </button>
    </div>
  );

  return (
    <>
      <button
        className="prefs-open"
        onClick={() => setOpen(true)}
        aria-label="Preferences"
        title="Preferences"
      >
        <Settings2 size={16} />
      </button>

      {open && (
        <div className="prefs-overlay" onClick={() => setOpen(false)}>
          <div className="prefs-panel" onClick={e => e.stopPropagation()}>
            <div className="prefs-head">
              <div>
                <div className="prefs-title">Preferences</div>
                <div className="prefs-sub">You decide how CeeKay feels.</div>
              </div>
              <button className="prefs-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <Row
              icon={prefs.sound ? Volume2 : VolumeX}
              label="Sound effects"
              sub={prefs.sound ? 'Playing taps, pops and celebration chimes' : 'Silent — nothing plays'}
              value={prefs.sound}
              onChange={v => setPref('sound', v)}
            />
            <Row
              icon={Sparkles}
              label="Celebration"
              sub={prefs.confetti ? 'Confetti when you place an order' : 'No confetti'}
              value={prefs.confetti}
              onChange={v => setPref('confetti', v)}
            />
            <Row
              icon={Zap}
              label="Animations"
              sub={prefs.animations ? 'Smooth motion throughout' : 'Static — no transitions'}
              value={prefs.animations}
              onChange={v => setPref('animations', v)}
            />

            <div className="prefs-foot">
              Saved automatically. Change anytime.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
