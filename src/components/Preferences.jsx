import { useEffect, useState } from 'react';
import { Settings2, X, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';
import { usePrefs } from '../context/PreferencesContext';

export default function Preferences({ isInline = false }) {
  const { prefs, setPref } = usePrefs();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isInline) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isInline]);

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

  const content = (
    <div className={isInline ? "inline-prefs" : "prefs-panel"}>
      {!isInline && (
        <div className="prefs-head">
          <div>
            <div className="prefs-title">Preferences</div>
            <div className="prefs-sub">You decide how CeeKay feels.</div>
          </div>
          <button className="prefs-close" onClick={() => setOpen(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}

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
    </div>
  );

  if (isInline) return content;

  return (
    <>
      <button className="prefs-open" onClick={() => setOpen(true)} aria-label="Preferences" title="Preferences">
        <Settings2 size={16} />
      </button>
      {open && (
        <div className="prefs-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}