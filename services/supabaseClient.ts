
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

export const setSupabaseAdminMode = (active: boolean) => {
  if (!supabase) return;
  const key = 'x-admin-key';
  const val = 'ReicrewAdminSecretKey';
  
  if (active) {
    if (supabase.postgrest && supabase.postgrest.headers) {
      supabase.postgrest.headers[key] = val;
    }
    if (supabase.rest && supabase.rest.headers) {
      supabase.rest.headers[key] = val;
    }
  } else {
    if (supabase.postgrest && supabase.postgrest.headers) {
      delete supabase.postgrest.headers[key];
    }
    if (supabase.rest && supabase.rest.headers) {
      delete supabase.rest.headers[key];
    }
  }
};
