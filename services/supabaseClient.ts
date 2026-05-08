
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SupabaseClient] Warning: Supabase environment variables are missing. Falling back to local storage.');
} else {
    console.log('[SupabaseClient] Initialized successfully with URL:', supabaseUrl);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (supabase) {
  console.log('✅ Supabase initialized successfully.');
}
