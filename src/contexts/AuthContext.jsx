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
  const initialSessionHandled = useRef(false);

  const fetchProfile = useCallback(async (userId, userObj = null) => {
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingRef.current && fetchedUserIdRef.current === userId) {
      return;
    }

    fetchingRef.current = true;
    fetchedUserIdRef.current = userId;
    
    try {
      // OPTIMIZATION: Try to get role from JWT metadata first (instant, no DB query!)
      const roleFromJWT = userObj?.app_metadata?.role;
      
      if (roleFromJWT) {
        // We have the role from JWT, but still need full profile data from DB
        // Set loading to false immediately with JWT data
        setProfile({
          id: userId,
          role: roleFromJWT,
          email: userObj.email || '',
          name: 'Loading...', // Will be updated by background fetch
          employee_id: 'Loading...'
        });
        setLoading(false); // Unblock UI immediately!
        
        // Fetch full profile in background (non-blocking)
        supabase
          .from(TABLES.EMPLOYEES)
          .select('*')
          .eq('id', userId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data); // Update with full data
            }
          });
        
        fetchingRef.current = false;
        return;
      }
      
      // Fallback: No JWT metadata, fetch from database (slower)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from(TABLES.EMPLOYEES)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (data) {
        setProfile(data);
      } else {
        console.error('No profile found for user:', userId);
        // Use fallback profile
        setProfile({ id: userId, role: 'employee', name: 'User', employee_id: 'TEMP' });
      }
    } catch (error) {
      console.error('Error fetching profile caught:', error);
      // Set a default profile so the app doesn't hang
      setProfile({ id: userId, role: 'employee', name: 'User', employee_id: 'TEMP' });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {      
      setUser(session?.user ?? null);
      if (session?.user) {        
        // Pass the user object to fetchProfile so it can use JWT metadata
        fetchProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {                
        setUser(session?.user ?? null);
        
        // Skip SIGNED_IN and INITIAL_SESSION profile fetch on mount since getSession handles it
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && !initialSessionHandled.current) {
          initialSessionHandled.current = true;          
          return;
        }
        
        // Only fetch profile on specific events, not on every auth change
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session?.user) {            
            await fetchProfile(session.user.id, session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          initialSessionHandled.current = false; // Reset for next login
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

