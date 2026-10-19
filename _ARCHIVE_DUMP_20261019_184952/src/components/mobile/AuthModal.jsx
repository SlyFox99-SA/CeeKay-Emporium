import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import { playSuccess, playError } from '../../lib/chime';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, verifyOtp } = useAuth();
  const haptics = useHaptics();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('options'); // 'options', 'email', or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    haptics.light();
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      playError(); haptics.error();
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { error } = await signInWithEmail(email);
    setLoading(false);
    if (error) { setError(error.message); playError(); haptics.error(); } 
    else { playSuccess(); haptics.success(); setStep('otp'); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true); setError('');
    const { error } = await verifyOtp(email, otp);
    setLoading(false);
    if (error) { setError(error.message); playError(); haptics.error(); } 
    else { playSuccess(); haptics.success(); onClose(); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px calc(24px + env(safe-area-inset-bottom))', zIndex: 9999, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '26px', margin: 0, color: 'var(--ck-ink)' }}>
                {step === 'options' ? 'Join the Club' : step === 'email' ? 'Sign In' : 'Check your Email'}
              </h2>
              <button onClick={onClose} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}>
                <X size={20} color="var(--ck-ink)" />
              </button>
            </div>

            {error && <div style={{ background: 'var(--ck-achaar-red)', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

            {step === 'options' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', margin: '0 0 8px', textAlign: 'center' }}>Sign in to earn free Kotas and skip the queue.</p>
                
                <button onClick={handleGoogle} style={{ width: '100%', padding: '16px', background: 'white', color: 'var(--ck-ink)', borderRadius: '16px', fontWeight: 700, border: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontSize: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <GoogleIcon /> Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--ck-border)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--ck-border)' }} />
                </div>

                <button onClick={() => setStep('email')} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Mail size={20} /> Continue with Email
                </button>
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendEmail}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
                  <Mail size={18} color="var(--ck-ink-soft)" style={{ marginRight: '12px' }} />
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '16px', color: 'var(--ck-ink)' }} required autoFocus />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? <Loader2 size={20} className="spin" /> : 'Send Login Code'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', marginBottom: '16px', textAlign: 'center' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
                <input type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ width: '100%', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '16px', padding: '20px', fontSize: '28px', textAlign: 'center', letterSpacing: '12px', fontWeight: 800, marginBottom: '16px', color: 'var(--ck-ink)' }} required autoFocus />
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? <Loader2 size={20} className="spin" /> : 'Verify & Sign In'}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}