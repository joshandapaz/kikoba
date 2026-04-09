import { supabase } from './supabase'
/**
 * API Client utility to handle differences between web and native environments.
 * In web, it uses relative paths (e.g., /api/login).
 * In native (Capacitor), it uses the NEXT_PUBLIC_API_URL if provided.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiClient(path: string, options: RequestInit = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  let url = normalizedPath;

  // HARD FALLBACK: If we detect native env here, we pre-redirect 
  // in case the layout.tsx interceptor missed it (e.g. race condition)
  if (typeof window !== 'undefined') {
    const isWeb = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    if (!isWeb) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://kikoba.vercel.app";
      url = apiBase.replace(/\/$/, '') + normalizedPath;
      // console.log('[DEBUG-NET-CLIENT] Bridge V6 Force Absolute:', url);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    return response;
  } catch (error) {
    console.error(`API Client Error (${url}):`, error);
    throw error;
  }
}
