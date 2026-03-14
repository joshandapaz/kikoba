'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Detect native environment (Capacitor)
  const isNative = typeof window !== 'undefined' && 
                   (window.location.protocol === 'capacitor:' || 
                    window.location.href.indexOf('capacitor://') === 0);
  const isWeb = !isNative;
  
  const FALLBACK_API = "http://192.168.1.10:3000";
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || FALLBACK_API).replace(/\/$/, '');
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}



