import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, resilientFetch, withTimeout } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error', 'offline'
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await resilientFetch(
        () => supabase.from('profiles').select('*').eq('id', userId).single(),
        { timeout: 10000, retries: 3 }
      );

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't fail the whole auth flow if profile fetch fails
    }
  }, []);

  const getInitialSession = useCallback(async () => {
    try {
      console.log(`Attempting to get Supabase session (attempt ${retryCountRef.current + 1}/${maxRetries})...`);
      setConnectionStatus('connecting');
      
      // Use resilient fetch with longer timeout for initial connection
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        12000 // 12 second timeout
      );
      
      if (sessionError) {
        throw sessionError;
      }
      
      console.log('Session result:', session ? 'User logged in' : 'No session (not logged in)');
      setUser(session?.user ?? null);
      setConnectionStatus('connected');
      setError(null);
      retryCountRef.current = 0; // Reset retry count on success
      
      if (session?.user) {
        // Fetch profile in background - don't block auth
        fetchProfile(session.user.id).catch(console.error);
      }
      
      return true;
    } catch (error) {
      console.error('Error getting session:', error);
      retryCountRef.current++;
      
      // Check if we should retry
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000) + Math.random() * 1000;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return getInitialSession(); // Recursive retry
      }
      
      setConnectionStatus('error');
      setError(error.message || 'Connection failed after multiple attempts');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Overall timeout to prevent infinite loading
    const overallTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - proceeding without auth');
        setLoading(false);
        setConnectionStatus('error');
        setError('Connection timeout - Supabase may be slow or unreachable');
      }
    }, 30000); // 30 second overall timeout

    getInitialSession();

    // Listen for auth changes
    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          setConnectionStatus('connected');
          setError(null);
          
          if (session?.user) {
            fetchProfile(session.user.id).catch(console.error);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      clearTimeout(overallTimeout);
      subscription?.unsubscribe();
    };
  }, [getInitialSession, fetchProfile]);

  // Manual retry connection function
  const retryConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    retryCountRef.current = 0; // Reset retry count
    return await getInitialSession();
  }, [getInitialSession]);

  const signUp = async (email, password, fullName) => {
    setError(null);
    try {
      const { data, error } = await resilientFetch(
        () => supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        }),
        { timeout: 15000, retries: 2 }
      );

      if (error) throw error;

      // Create profile after signup
      if (data.user) {
        try {
          await resilientFetch(
            () => supabase.from('profiles').insert([
              {
                id: data.user.id,
                email: email,
                full_name: fullName,
                role: 'consultant',
              },
            ]),
            { timeout: 10000, retries: 2 }
          );
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail signup if profile creation fails
        }
      }

      setConnectionStatus('connected');
      return data;
    } catch (error) {
      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        setError('Network error - please check your connection and try again');
      } else {
        setError(error.message);
      }
      throw error;
    }
  };

  const signIn = async (email, password) => {
    setError(null);
    try {
      const { data, error } = await resilientFetch(
        () => supabase.auth.signInWithPassword({
          email,
          password,
        }),
        { timeout: 15000, retries: 2 }
      );

      if (error) throw error;
      setConnectionStatus('connected');
      return data;
    } catch (error) {
      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        setError('Network error - please check your connection and try again');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else {
        setError(error.message);
      }
      throw error;
    }
  };

  const signInWithMagicLink = async (email) => {
    setError(null);
    try {
      const { data, error } = await resilientFetch(
        () => supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        }),
        { timeout: 15000, retries: 2 }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        setError('Network error - please check your connection and try again');
      } else {
        setError(error.message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        10000
      );
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signout fails on server, clear local state
    }
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    error,
    connectionStatus,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    retryConnection,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};