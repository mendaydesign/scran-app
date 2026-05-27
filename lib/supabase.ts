// Supabase client — single shared instance for the whole app.
// expo-secure-store is used as the auth token storage so sessions persist
// securely across app restarts. When auth is added, the same client handles it.

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL  = 'https://zpxvbgtoeldcdkoihpkq.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_5fwylmBIO-BDPpzC0f70SA_8jhgjVcw';

// SecureStore adapter — stores Supabase auth tokens encrypted on the device
const SecureStoreAdapter = {
  getItem:    (key: string)              => SecureStore.getItemAsync(key),
  setItem:    (key: string, val: string) => SecureStore.setItemAsync(key, val),
  removeItem: (key: string)              => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage:           SecureStoreAdapter,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});
