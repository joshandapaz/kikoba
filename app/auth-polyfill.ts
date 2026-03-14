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
      
      // Resolve relative or qualified auth URLs to absolute ones
      // Matches: "/api/auth/*", "api/auth/*", or "capacitor://localhost/api/auth/*"
      const isAuthPath = url.includes('/api/auth/') || url.includes('api/auth/');
      const isLocal = url.startsWith('/') || url.startsWith('capacitor://') || url.startsWith('http://localhost');

      if (isAuthPath && isLocal && apiBaseUrl) {
          let path = url;
          if (url.includes('://')) {
              try {
                  const urlObj = new URL(url);
                  path = urlObj.pathname + urlObj.search + urlObj.hash;
              } catch (e) {
                  const parts = url.split('://');
                  if (parts.length > 1) {
                      const afterProtocol = parts[1];
                      path = '/' + afterProtocol.split('/').slice(1).join('/');
                  }
              }
          }
          
          if (!path.startsWith('/')) path = '/' + path;
          
          // Final absolute URL
          const absoluteUrl = `${apiBaseUrl.replace(/\/$/, '')}${path}`;
          console.log(`[Capacitor-Auth] INTERCEPTED: ${url} -> ${absoluteUrl}`);
          url = absoluteUrl;
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
