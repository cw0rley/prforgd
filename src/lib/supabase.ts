import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://boyjkzbouqqvhnggcgun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWpremJvdXFxdmhuZ2djZ3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjg2MjksImV4cCI6MjA5NTg0NDYyOX0.Ilgy06ixFPs9sxENvYSLfpwvabGjt4ROATF6bORJj1g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
