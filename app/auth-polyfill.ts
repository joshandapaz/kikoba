/**
 * CAPACITOR / NATIVE AUTH POLYFILL
 * This file is imported at the very top of Providers.tsx to ensure it runs
 * before next-auth/react is even imported. This prevents race conditions
 * where next-auth would capture a reference to the original fetch.
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';

if (typeof window !== 'undefined') {
  const protocol = window.location.protocol;
  const isWeb = protocol === 'http:' || protocol === 'https:';
  
  if (!isWeb) {
    console.log('[Capacitor-Auth] Synchronous polyfill initializing...');
    console.log('[Capacitor-Auth] Protocol:', protocol);
    console.log('[Capacitor-Auth] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('[Capacitor-Auth] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('[Capacitor-Auth] Effective Base URL:', apiBaseUrl);

    if (!apiBaseUrl) {
      console.error('[Capacitor-Auth] CRITICAL: No API Base URL found! Relative fetches will fail on mobile.');
    }

    // 1. Polyfill fetch globally
    const originalFetch = window.fetch;
    const authPolyfillFetch = function(input: RequestInfo | URL, init?: RequestInit) {
      let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
      
      // Resolve relative auth URLs to absolute ones
      if ((url.startsWith('/api/auth') || url.startsWith('api/auth'))) {
        if (apiBaseUrl) {
          const path = url.startsWith('/') ? url : `/${url}`;
          const absoluteUrl = `${apiBaseUrl.replace(/\/$/, '')}${path}`;
          console.log(`[Capacitor-Auth] Intercepting fetch: ${url} -> ${absoluteUrl}`);
          url = absoluteUrl;
        } else {
          console.warn(`[Capacitor-Auth] Attempted auth fetch to ${url} but apiBaseUrl is missing!`);
        }
      }

      const newInit = { ...init };
      
      // Fix for "Beacons can only be sent over HTTP(S)"
      if (newInit?.keepalive && protocol === 'capacitor:') {
        delete (newInit as any).keepalive;
        console.log('[Capacitor-Auth] Stripped keepalive (beacon protection)');
      }

      return originalFetch(url, newInit);
    };

    window.fetch = authPolyfillFetch as any;
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).fetch = authPolyfillFetch;
    }

    // 2. Configure NextAuth global window object
    if (apiBaseUrl) {
      (window as any).__NEXTAUTH = {
        baseUrl: apiBaseUrl,
        basePath: '/api/auth'
      };
    }

    // 3. sendBeacon Polyfill
    if (window.navigator) {
      const originalSendBeacon = window.navigator.sendBeacon;
      window.navigator.sendBeacon = function(url, data) {
        if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('https'))) {
          return originalSendBeacon ? originalSendBeacon.apply(this, [url, data]) : true;
        }
        console.log('[Capacitor-Auth] Suppressed beacon for non-http protocol');
        return true;
      };
    }
  }
}
export {};
