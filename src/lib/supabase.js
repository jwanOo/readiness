import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Log configuration for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key format:', supabaseAnonKey?.substring(0, 15) + '...');
}

// Create Supabase client with optimized settings for unstable connections
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Store session in localStorage for persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Longer flow state expiry for slow connections
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'ai-readiness-check',
    },
  },
  // Realtime settings - disable if not needed to reduce connection overhead
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Timeout wrapper for Supabase operations
export const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};

// Retry wrapper with exponential backoff
export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (import.meta.env.DEV) {
        console.warn(`Attempt ${i + 1}/${maxRetries} failed:`, error.message);
      }
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 500; // Add jitter
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Combined timeout + retry wrapper
export const resilientFetch = async (fn, options = {}) => {
  const { timeout = 10000, retries = 3, baseDelay = 1000 } = options;
  return withRetry(
    () => withTimeout(fn(), timeout),
    retries,
    baseDelay
  );
};

// Helper function to check if Supabase is properly configured and reachable
export const checkSupabaseConnection = async () => {
  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      8000 // 8 second timeout for connection check
    );
    
    if (result.error) {
      return { connected: false, error: result.error.message };
    }
    
    return { connected: true, session: result.data.session };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// Helper function to get current user with retry
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await resilientFetch(
      () => supabase.auth.getUser(),
      { timeout: 8000, retries: 2 }
    );
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Helper function to get user profile with retry
export const getUserProfile = async (userId) => {
  const { data, error } = await resilientFetch(
    () => supabase.from('profiles').select('*').eq('id', userId).single(),
    { timeout: 8000, retries: 2 }
  );
  
  if (error) throw error;
  return data;
};

// Export configuration info for debugging
export const supabaseConfig = {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 15),
  isConfigured: supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey !== 'your-anon-key',
};