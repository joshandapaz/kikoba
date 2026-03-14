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
    const isNative = (
      window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'app:' ||
      (window as any).Capacitor
    );
    if (isNative) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.101:3000";
      url = apiBase.replace(/\/$/, '') + normalizedPath;
      // console.log('[DEBUG-NET-CLIENT] Forcing Absolute URL:', url);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
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
