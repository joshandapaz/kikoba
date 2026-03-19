'use client'
import { SessionProvider } from 'next-auth/react'

/**
 * In Capacitor (native), the app runs at capacitor://localhost.
 * NextAuth needs an absolute basePath pointing to the real backend
 * so it doesn't try to fetch capacitor://localhost/api/auth/session.
 */
function getAuthBasePath(): string {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol;
    if (proto !== 'http:' && proto !== 'https:') {
      // Native environment: use absolute URL to the backend
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.101:3000').replace(/\/$/, '');
      return `${apiUrl}/api/auth`;
    }
  }
  return '/api/auth';
}

export function Providers({ children }: { children: React.ReactNode }) {
  const basePath = getAuthBasePath();
  return (
    <SessionProvider basePath={basePath}>
      {children}
    </SessionProvider>
  )
}

