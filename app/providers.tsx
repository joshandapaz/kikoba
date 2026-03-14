'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // In native/Capacitor environment, we need to point NextAuth to the absolute API URL
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  // Force NextAuth to use the absolute URL globally in the client
  if (typeof window !== 'undefined' && !isWeb && apiBaseUrl) {
    (window as any).__NEXTAUTH = {
      baseUrl: apiBaseUrl,
      basePath: '/api/auth'
    };
  }

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}
