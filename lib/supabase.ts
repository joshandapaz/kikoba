import { createClient, SupportedStorage } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

// Custom storage implementation for Capacitor to ensure session persistence on mobile
const capacitorStorage: SupportedStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key })
  },
}

// Hardcoded defaults to ensure GitHub Actions builds are functional
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bggiguzhkdxfwgfbuqfy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vV7AI5fs6Fg3kD3BTHq0AQ_vNVphkVY'

// Standard client for client-side with persistent storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Improve performance in mobile apps
  }
})

// Admin client for server-side (bypasses RLS)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any
