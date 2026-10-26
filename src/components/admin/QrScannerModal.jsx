/* eslint-disable react-hooks/immutability */
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function QrScannerModal({ onClose, onOrderFound }) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const haptics = useHaptics();
  
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    // Initialize the raw Html5Qrcode instance (NO default UI)
    const html5QrCode = new Html5Qrcode("ck-qr-reader");
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        // Success! Stop scanning and process order.
        html5QrCode.stop().then(() => {
          setScanning(false);
          haptics.success();
          fetchOrder(decodedText);
        }).catch(err => console.error("Failed to stop scanner", err));
      },
      (err) => {
        // Ignore continuous scan errors (it fires constantly when no QR is in frame)
      }
    ).catch((err) => {
      console.error(err);
      setError('Could not access camera. Please check permissions.');
      setScanning(false);
    });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  const fetchOrder = async (orderNumber) => {
    try {
      // Assuming the QR code contains the order_number
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error || !data) {
        haptics.error();
        setError(`Order ${orderNumber} not found.`);
        setScanning(false);
        return;
      }

      onOrderFound(data);
    } catch (err) {
      haptics.error();
      setError(`Error looking up order: ${err.message}`);
    }
  };

  const retryScan = () => {
    setError('');
    setScanning(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
      
      {/* CUSTOM HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
        <h2 style={{ margin: 0, color: 'white', fontFamily: 'var(--ck-font-serif)', fontSize: '22px' }}>Scan Collection QR</h2>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
          <X size={24} color="white" />
        </button>
      </header>

      {/* CAMERA VIEWPORT */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* The actual video feed from html5-qrcode */}
        <div id="ck-qr-reader" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* CUSTOM TARGETING OVERLAY */}
        {scanning && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Darkened background outside the scan box */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            
            <div style={{ position: 'relative', width: '260px', height: '260px' }}>
              
              {/* Top Left Bracket */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderTop: '4px solid var(--ck-warm)', borderLeft: '4px solid var(--ck-warm)', borderRadius: '16px 0 0 0' }} />
              
              {/* Top Right Bracket */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', borderTop: '4px solid var(--ck-warm)', borderRight: '4px solid var(--ck-warm)', borderRadius: '0 16px 0 0' }} />
              
              {/* Bottom Left Bracket */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', borderBottom: '4px solid var(--ck-warm)', borderLeft: '4px solid var(--ck-warm)', borderRadius: '0 0 0 16px' }} />
              
              {/* Bottom Right Bracket */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', borderBottom: '4px solid var(--ck-warm)', borderRight: '4px solid var(--ck-warm)', borderRadius: '0 0 16px 0' }} />

              {/* Animated Scanning Line */}
              <motion.div 
                animate={{ y: [0, 260, 0] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: '2px', background: 'var(--ck-warm)', boxShadow: '0 0 15px 3px rgba(212, 149, 43, 0.5)' }}
              />
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <AlertCircle size={64} color="#E53935" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'white', fontSize: '20px', margin: '0 0 24px' }}>{error}</h3>
            <button onClick={retryScan} style={{ padding: '16px 32px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM HINT */}
      {!error && (
        <div style={{ padding: '30px 20px', background: 'rgba(0,0,0,0.8)', textAlign: 'center', zIndex: 10 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>
            Align the customer's order QR code within the frame.
          </p>
        </div>
      )}
    </div>
  );
}
