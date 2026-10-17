
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="m-pwa-banner">
      <div className="m-pwa-icon"><Download size={20} /></div>
      <div className="m-pwa-text">
        <div className="m-pwa-title">Install App</div>
        <div className="m-pwa-sub">
          {isIOS 
            ? "Tap Share and 'Add to Home Screen'" 
            : "Add to home screen for full-screen access"}
        </div>
      </div>
      {!isIOS && (
        <button className="m-pwa-btn" onClick={handleInstall}>Install</button>
      )}
      <button className="m-pwa-close" onClick={() => setShow(false)}><X size={16} /></button>
    </div>
  );
}
