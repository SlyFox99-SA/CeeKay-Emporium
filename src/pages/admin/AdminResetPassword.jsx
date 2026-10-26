 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CKMark from '../../components/CKMark';

export default function AdminResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Wait a moment for Supabase to process the token from the URL
    const checkSession = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    }, 500);

    return () => clearTimeout(checkSession);
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage('Password updated successfully!');
      setTimeout(() => navigate('/admin'), 1500);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ck-cream)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><CKMark size={48} /></div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>Set New Password</h1>
        </div>

        {error && <div style={{ background: 'rgba(229, 57, 53, 0.1)', color: 'var(--ck-achaar-red)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}
        {message && <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: 'var(--ck-green)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>{message}</div>}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>New Password</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
