/**
 * API Client utility to handle differences between web and native environments.
 * In web, it uses relative paths (e.g., /api/login).
 * In native (Capacitor), it uses the NEXT_PUBLIC_API_URL if provided.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiClient(path: string, options: RequestInit = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Detect native environment (Capacitor)
  const isNative = typeof window !== 'undefined' && 
                   (window.location.protocol === 'capacitor:' || 
                    window.location.href.indexOf('capacitor://') === 0);
  
  const isWeb = !isNative && typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  // Hardcoded fallback for production-build native apps if env var is missing
  const FALLBACK_API = "http://192.168.1.10:3000";
  const baseUrl = isWeb ? '' : (API_URL || FALLBACK_API);
  
  if (!isWeb && !API_URL) {
    console.warn('API Client: Running in non-web environment but NEXT_PUBLIC_API_URL is not set.');
  }

  const url = `${baseUrl}${normalizedPath}`;

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
