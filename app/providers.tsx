'use client'
import { SessionProvider } from 'next-auth/react'

/**
 * CAPACITOR / NATIVE AUTH POLYFILL
 * This logic runs synchronously when the module loads to ensure it intercepts 
 * all fetch calls, including the initial session check by SessionProvider.
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';

if (typeof window !== 'undefined') {
  const protocol = window.location.protocol;
  const isWeb = protocol === 'http:' || protocol === 'https:';
  
  if (!isWeb) {
    console.log('[Capacitor-Auth] Applying polyfills for native environment');
    console.log('[Capacitor-Auth] Protocol:', protocol);
    console.log('[Capacitor-Auth] API Base URL:', apiBaseUrl);
    
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
      
      // 1. Resolve relative auth URLs to absolute ones
      if (url.startsWith('/api/auth') && apiBaseUrl) {
        url = `${apiBaseUrl}${url}`;
      }

      const newInit = { ...init };
      
      // 2. Fix for "Beacons can only be sent over HTTP(S)"
      // Capacitor:// protocol doesn't support keepalive: true (beacons)
      if (newInit?.keepalive && protocol === 'capacitor:') {
        delete (newInit as any).keepalive;
      }

      return originalFetch(url, newInit);
    } as any;

    // 3. Configure NextAuth global window object
    if (apiBaseUrl) {
      (window as any).__NEXTAUTH = {
        baseUrl: apiBaseUrl,
        basePath: '/api/auth'
      };
    }

    // 4. sendBeacon Polyfill (fallback for next-auth telemetry/beacons)
    if (window.navigator && !window.navigator.sendBeacon) {
      (window.navigator as any).sendBeacon = (url: string) => {
        // Just consume it to prevent crashes
        return true;
      };
    } else if (window.navigator && window.navigator.sendBeacon) {
      const originalSendBeacon = window.navigator.sendBeacon;
      window.navigator.sendBeacon = function(url, data) {
        if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('https'))) {
          return originalSendBeacon.apply(this, [url, data]);
        }
        return true;
      };
    }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}


