import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type AdminRole = 'user' | 'admin' | null;

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Maps admin login username to internal email for Supabase Auth
const ADMIN_EMAIL_MAP: Record<string, string> = {
  valeriya: 'valeriya@carnicalforyou.com',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string, appMetaRole?: string) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      console.log('[auth] loadProfile — profile:', profile, 'error:', profileError);

      if (!mounted) return;

      const isAdmin = profile?.role === 'admin' || appMetaRole === 'admin';
      setAdminRole(isAdmin ? 'admin' : 'user');
      console.log('[auth] loadProfile — isAdmin:', isAdmin);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      console.log('[auth] getSession — session:', !!data.session, 'user id:', data.session?.user?.id);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user.app_metadata?.role);
      } else {
        setAdminRole(null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] onAuthStateChange — event:', event, 'session:', !!session, 'user id:', session?.user?.id);

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setAdminRole(null);
        setLoading(false);
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION — keep loading true until role is resolved
      setUser(session.user);
      setLoading(true);
      (async () => {
        await loadProfile(session.user.id, session.user.app_metadata?.role);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    console.log('[auth] Login started — username:', username);
    const email = ADMIN_EMAIL_MAP[username.trim().toLowerCase()];
    if (!email) {
      console.log('[auth] No email mapping for username:', username);
      return { error: 'Невалидно потребителско име.' };
    }

    console.log('[auth] Calling signInWithPassword with email:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.log('[auth] signInWithPassword error:', error.message);
      return { error: 'Грешно потребителско име или парола.' };
    }
    console.log('[auth] Login success — signInWithPassword resolved');

    // onAuthStateChange will fire SIGNED_IN and load the profile + set loading=false.
    // Wait for loading to settle so callers know the auth state is fully resolved.
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin: adminRole === 'admin', loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
