import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('ceekay-install-dismissed');
    if (dismissed) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setTimeout(() => setVisible(true), 4000);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('ceekay-install-dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className={`install-prompt ${visible ? 'show' : ''}`}>
      <button className="install-close" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
      <div className="install-icon">🍔</div>
      <div className="install-text">
        <div className="install-title">Install CeeKay</div>
        <div className="install-sub">Add to your home screen for one-tap ordering</div>
      </div>
      <button className="install-btn" onClick={install}>
        <Download size={14} /> Install
      </button>
    </div>
  );
}
