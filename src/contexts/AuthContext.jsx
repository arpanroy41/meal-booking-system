import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, TABLES } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const fetchedUserIdRef = useRef(null);

  const fetchProfile = useCallback(async (userId) => {
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingRef.current && fetchedUserIdRef.current === userId) {
      console.log('fetchProfile already in progress for userId:', userId);
      return;
    }

    fetchingRef.current = true;
    fetchedUserIdRef.current = userId;
    console.log('fetchProfile called for userId:', userId);
    
    try {
      console.log('Fetching from employees table...');
      
      // Add a timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from(TABLES.EMPLOYEES)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('fetchProfile result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (data) {
        console.log('Profile loaded successfully:', data.role);
        setProfile(data);
      } else {
        console.error('No profile found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching profile caught:', error);
      // Set a default profile so the app doesn't hang
      setProfile({ id: userId, role: 'employee', name: 'User', employee_id: 'TEMP' });
    } finally {
      console.log('fetchProfile completed, setting loading=false');
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    console.log('AuthContext signIn called with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('AuthContext signIn result:', { 
        success: !!data?.user, 
        userId: data?.user?.id,
        error: error?.message 
      });
      return { data, error };
    } catch (err) {
      console.error('AuthContext signIn exception:', err);
      throw err;
    }
  };

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear profile state and reset fetch tracking
      setProfile(null);
      setUser(null);
      fetchedUserIdRef.current = null;
      fetchingRef.current = false;
    }
    return { error };
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isVendor: profile?.role === 'vendor',
    isEmployee: profile?.role === 'employee',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

