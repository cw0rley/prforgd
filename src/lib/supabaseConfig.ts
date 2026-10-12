/**
 * Supabase connection constants, kept free of any React Native imports so
 * plain-Node consumers (the drift test, CI scripts) can use them without
 * pulling in AsyncStorage and the rest of the client.
 *
 * The anon key is a public, client-side key by design — it ships in every build
 * and is gated by row-level security. It is not a secret.
 */

export const SUPABASE_URL = 'https://boyjkzbouqqvhnggcgun.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWpremJvdXFxdmhuZ2djZ3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjg2MjksImV4cCI6MjA5NTg0NDYyOX0.Ilgy06ixFPs9sxENvYSLfpwvabGjt4ROATF6bORJj1g';
