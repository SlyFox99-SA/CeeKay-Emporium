import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function QrScannerModal({ onClose, onOrderFound }) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const haptics = useHaptics();

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner('qr-reader', { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanning(false);
        haptics.success();

        // Fetch the order from Supabase
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', decodedText)
          .single();

        if (error || !data) {
          setError(`Order ${decodedText} not found in the system.`);
          haptics.error();
          return;
        }

        onOrderFound(data);
      },
      (err) => {
        // Ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'white' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>Scan Customer QR</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}>
          <X size={24} color="var(--ck-ink)" />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {error ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <AlertTriangle size={64} color="#E53935" style={{ marginBottom: '16px' }} />
            <h3>{error}</h3>
            <button onClick={() => { setError(''); setScanning(true); }} style={{ marginTop: '20px', padding: '12px 24px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 700 }}>Try Again</button>
          </div>
        ) : (
          <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', background: 'white' }}></div>
        )}
      </div>
    </motion.div>
  );
}