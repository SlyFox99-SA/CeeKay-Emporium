import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useDynamicManifest() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let appName = 'CeeKay Emporium';
    let shortName = 'CeeKay';
    let startUrl = '/';
    let themeColor = '#0f2e4a';
    let description = "Kota, done properly. Order from Benoni's kota spot.";

    if (path.startsWith('/admin')) {
      appName = 'CeeKay Admin';
      shortName = 'CK Admin';
      startUrl = '/#/admin';
      themeColor = '#1a1a1a';
      description = 'Manage CeeKay Emporium store, menu and orders.';
    } else if (path.startsWith('/kitchen')) {
      appName = 'CeeKay Kitchen';
      shortName = 'CK Kitchen';
      startUrl = '/#/kitchen';
      themeColor = '#1a1a1a';
      description = 'Live kitchen order dashboard.';
    }

    // Ensure the URLs are absolute to stop browser warnings
    const base = window.location.origin;
    const manifest = {
      name: appName,
      short_name: shortName,
      description: description,
      start_url: base + startUrl,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#f5ecd9',
      theme_color: themeColor,
      icons: [
        {
          src: base + '/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    };

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    
    const oldHref = link.href;
    link.href = manifestURL;
    
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', themeColor);

    return () => {
      URL.revokeObjectURL(manifestURL);
      if (oldHref) link.href = oldHref;
    };
  }, [location.pathname]);
}