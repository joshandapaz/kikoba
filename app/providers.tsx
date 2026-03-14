'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // detect native by checking protocol
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  // Polyfill fetch to fix "Beacons can only be sent over HTTP(S)" error in Capacitor
  // and handle absolute URLs for NextAuth internal fetches
  useEffect(() => {
    if (typeof window !== 'undefined' && !isWeb) {
      const originalFetch = window.fetch;
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
        
        // Ensure absolute URL if it starts with /api/auth (NextAuth internal calls)
        if (url.startsWith('/api/auth') && apiBaseUrl) {
          url = `${apiBaseUrl}${url}`;
        }

        const newInit = { ...init };
        
        // Strip keepalive if protocol is capacitor:// or if it's an internal auth call
        // next-auth uses keepalive: true which triggers beacon attempts
        if (newInit?.keepalive && window.location.protocol === 'capacitor:') {
          delete (newInit as any).keepalive;
        }

        return originalFetch(url, newInit);
      } as any;
      
      // Global config for NextAuth client
      if (apiBaseUrl) {
        (window as any).__NEXTAUTH = {
          baseUrl: apiBaseUrl,
          basePath: '/api/auth'
        };
      }
    }
  }, [isWeb, apiBaseUrl]);

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}

