import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { initGoogleServices } from '@/lib/google-services'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kikoba Smart - Mfumo wa Akiba na Mikopo',
  description: 'Dhibiti akiba na mikopo ya kikundi chako kwa urahisi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootLayoutClient>{children}</RootLayoutClient>
}

function RootLayoutClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGoogleServices()
  }, [])

  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Kill beacons to prevent capacitor:// scheme errors
              try {
                if (window.navigator) {
                  Object.defineProperty(window.navigator, 'sendBeacon', {
                    value: function() { return true; },
                    writable: false,
                    configurable: false
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
