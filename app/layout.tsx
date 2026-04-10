import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { InitClient } from './init-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kikoba Smart - Mfumo wa Akiba na Mikopo',
  description: 'Dhibiti akiba na mikopo ya kikundi chako kwa urahisi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kikoba Smart',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // KEY: enables safe-area-inset support for iOS notch
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <InitClient />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
