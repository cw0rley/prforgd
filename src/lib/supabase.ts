import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://uqtlqprxepcpajvrxies.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGxxcHJ4ZXBjcGFqdnJ4aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDk5OTgsImV4cCI6MjA5MjUyNTk5OH0.ZDxH9XBze-nXPXWM95hlxofDFEP1MxK2bg9JjiwCDCo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
