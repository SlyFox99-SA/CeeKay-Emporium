import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CKMark from '../../components/CKMark';

export default function AdminLogin() {
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="admin-login-loading">Loading...</div>;
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, fullName);
        setError('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-head">
          <span className="admin-login-mark"><CKMark size={44} /></span>
          <div className="admin-login-eyebrow">CeeKay Emporium</div>
          <h1 className="admin-login-title">
            {mode === 'signin' ? 'Back office' : 'Create account'}
          </h1>
          <p className="admin-login-sub">
            {mode === 'signin'
              ? 'Sign in to manage the menu, orders and stores.'
              : 'Sign up. You will need an admin to grant you access.'}
          </p>
        </div>
        <form onSubmit={submit} className="admin-login-form">
          {mode === 'signup' && (
            <label className="field">
              <span className="field-label">Full name</span>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
            </label>
          )}
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ceekay.co.za" autoComplete="email" required />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
          </label>
          {error && <div className="admin-login-error">{error}</div>}
          <button type="submit" className="admin-login-submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button className="admin-login-toggle" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}