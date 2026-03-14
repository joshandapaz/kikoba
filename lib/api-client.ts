/**
 * API Client utility to handle differences between web and native environments.
 * In web, it uses relative paths (e.g., /api/login).
 * In native (Capacitor), it uses the NEXT_PUBLIC_API_URL if provided.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiClient(path: string, options: RequestInit = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // In native environments, we need absolute URLs
  // We detect native by checking if we are in a non-web protocol or if Capacitor is present
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const baseUrl = isWeb ? '' : API_URL;
  
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
