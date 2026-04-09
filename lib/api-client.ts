import { supabase } from './supabase'
/**
 * API Client utility to handle differences between web and native environments.
 * In web, it uses relative paths (e.g., /api/login).
 * In native (Capacitor), it uses the NEXT_PUBLIC_API_URL if provided.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * @deprecated The app has moved to a STANDALONE architecture.
 * Do not use apiClient for internal app logic.
 * Use the services in @/lib/services/ instead (e.g., dashboardService, groupService).
 */
export async function apiClient(path: string, options: RequestInit = {}) {
  const errorMsg = `[DEPRECATED] Attempted to call API: ${path}. The app is now STANDALONE. Use lib/services instead.`;
  console.error(errorMsg);
  
  // Return a failed response to avoid breaking everything if a component still calls it
  return new Response(JSON.stringify({ 
    error: "Architecture Migration: Internal API is no longer used.",
    deprecated: true 
  }), { 
    status: 410, // Gone
    headers: { 'Content-Type': 'application/json' }
  });
}
