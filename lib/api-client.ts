/**
 * API Client utility to handle differences between web and native environments.
 * In web, it uses relative paths (e.g., /api/login).
 * In native (Capacitor), it uses the NEXT_PUBLIC_API_URL if provided.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiClient(path: string, options: RequestInit = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // We ALWAYS use relative paths now. 
  // Our Transparent Proxy in layout.tsx handles the redirection to absolute backend IP.
  const url = normalizedPath;

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
