import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, loading: true });

  useEffect(() => {
    let mounted = true;

    const resolve = async (session) => {
      if (!mounted) return;

      if (!session?.user) {
        setState({ user: null, profile: null, loading: false });
        return;
      }

      setState((s) => ({ ...s, user: session.user, loading: true }));

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) return;
      setState({ user: session.user, profile: data || null, loading: false });
    };

    supabase.auth.getSession().then(({ data: { session } }) => resolve(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { resolve(session); }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        profile: state.profile,
        loading: state.loading,
        signIn,
        signUp,
        signOut,
        isAdmin: state.profile?.role === 'admin',
        isKitchen: state.profile?.role === 'kitchen' || state.profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);