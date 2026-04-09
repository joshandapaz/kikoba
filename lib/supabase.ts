import { createClient } from '@supabase/supabase-js'

// Hardcoded defaults to ensure GitHub Actions builds are functional
// Note: NEXT_PUBLIC_ variables are inlined at build time. 
// These fallbacks ensure the app works even if .env is missing during build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bggiguzhkdxfwgfbuqfy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'

// Standard client for client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side (bypasses RLS)
// Only initialize if the Service Role Key is available (server-side only)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any
