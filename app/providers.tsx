'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  const isWeb = typeof window !== 'undefined' && 
                (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const basePath = isWeb ? undefined : `${apiBaseUrl}/api/auth`;

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}



