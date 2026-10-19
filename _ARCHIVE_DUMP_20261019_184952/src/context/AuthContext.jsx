import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile data (loyalty points, phone, etc.)
  const fetchProfile = async (userId) => {
    if (!userId) return setProfile(null);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
    }
    setProfile(data);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

    const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signInWithEmail = async (email) => {
    return await supabase.auth.signInWithOtp({ email });
  };

  const verifyOtp = async (email, token) => {
    return await supabase.auth.verifyOtp({ email, token, type: 'email' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);