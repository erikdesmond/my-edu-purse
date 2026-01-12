import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type PortalType = 'admin' | 'citizen';
type AppRole = 'admin' | 'finance' | 'school_ops' | 'customer_service' | 'it_support' | 'citizen';

interface AuthContextType {
  portal: PortalType | null;
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; portal?: PortalType }>;
  signUp: (email: string, password: string, role: AppRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [portal, setPortal] = useState<PortalType | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole !== null && userRole !== 'citizen';

  // Fetch user role from database
  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as AppRole || null;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return null;
    }
  };

  // Determine portal based on role
  const getPortalFromRole = (role: AppRole | null): PortalType | null => {
    if (!role) return null;
    if (role === 'citizen') return 'citizen';
    return 'admin';
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer role fetching to avoid blocking
          setTimeout(async () => {
            const role = await fetchUserRole(newSession.user.id);
            setUserRole(role);
            setPortal(getPortalFromRole(role));
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setPortal(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const role = await fetchUserRole(existingSession.user.id);
        setUserRole(role);
        setPortal(getPortalFromRole(role));
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; portal?: PortalType }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        
        if (!role) {
          // User exists but has no role assigned
          await supabase.auth.signOut();
          return { success: false, error: 'No role assigned to this account. Please contact an administrator.' };
        }

        setUserRole(role);
        const userPortal = getPortalFromRole(role);
        setPortal(userPortal);
        
        return { success: true, portal: userPortal ?? undefined };
      }

      return { success: false, error: 'Login failed' };
    } catch (err) {
      console.error('Sign in error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, role: AppRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Assign role to user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          return { success: false, error: 'Account created but role assignment failed. Please contact support.' };
        }

        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (err) {
      console.error('Sign up error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setPortal(null);
  };

  return (
    <AuthContext.Provider value={{
      portal,
      user,
      session,
      userRole,
      isAdmin,
      loading,
      signIn,
      signUp,
      signOut,
      isAuthenticated: !!user && !!userRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
