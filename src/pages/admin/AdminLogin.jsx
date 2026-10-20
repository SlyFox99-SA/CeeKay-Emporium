import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CKMark from '../../components/CKMark';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setTimeout(() => navigate('/admin'), 200);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');

    // Redirect to the ROOT. Supabase will append #access_token=...
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the reset link.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ck-cream)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><CKMark size={48} /></div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>
            {isResetting ? 'Reset Password' : 'Admin Login'}
          </h1>
          <p style={{ color: 'var(--ck-ink-soft)', fontSize: '14px', margin: 0 }}>
            {isResetting ? 'Enter your email to receive a link' : 'Manage your store'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(229, 57, 53, 0.1)', color: 'var(--ck-achaar-red)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}
        {message && <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: 'var(--ck-green)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{message}</div>}

        <form onSubmit={isResetting ? handleReset : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Email</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ceekay.com" required 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px', outline: 'none' }}
            />
          </div>
          
          {!isResetting && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Password</label>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required 
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px', outline: 'none' }}
              />
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}
          >
            {loading ? 'Processing...' : (isResetting ? 'Send Reset Link' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => { setIsResetting(!isResetting); setError(''); setMessage(''); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--ck-brand-deep)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            {isResetting ? 'Back to Login' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    </div>
  );
}