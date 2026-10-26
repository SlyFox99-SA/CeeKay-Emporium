/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. If the app is already installed, never show the banner
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // 2. If the user has previously dismissed it, respect their choice
    const isDismissed = localStorage.getItem('ceekay-pwa-dismissed');
    if (isDismissed) return;

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
    
    if (outcome === 'accepted') {
      setShow(false);
      localStorage.setItem('ceekay-pwa-dismissed', 'true'); // Save their choice
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    // Save their choice so it doesn't pop up again
    localStorage.setItem('ceekay-pwa-dismissed', 'true');
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
      <button className="m-pwa-close" onClick={handleDismiss}><X size={16} /></button>
    </div>
  );
}

