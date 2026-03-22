'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Use absolute URL for NextAuth API so it doesn't fail on capacitor:// scheme
  const isWeb = typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://kikoba.vercel.app";
  const basePath = isWeb ? "/api/auth" : `${apiBase.replace(/\/$/, '')}/api/auth`;

  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}
