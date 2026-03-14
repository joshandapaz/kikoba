'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // In native/Capacitor environment, we need to point NextAuth to the absolute API URL
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}
