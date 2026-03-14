import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ErrorDetector from '@/components/ErrorDetector'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kikoba Smart - Mfumo wa Akiba na Mikopo',
  description: 'Dhibiti akiba na mikopo ya kikundi chako kwa urahisi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Fix for Capacitor: Beacons can only be sent over HTTP(S)
  if (typeof window !== 'undefined' && window.navigator && !window.navigator.sendBeacon) {
    // Already handled or missing
  } else if (typeof window !== 'undefined' && window.navigator) {
    const originalSendBeacon = window.navigator.sendBeacon;
    window.navigator.sendBeacon = function(url, data) {
      if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('https'))) {
        return originalSendBeacon.apply(this, [url, data]);
      }
      return true; // Fake success for non-http protocols
    };
  }

  return (
    <html lang="sw" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <ErrorDetector />
        </Providers>
      </body>
    </html>
  )
}
