import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ErrorDetector from '@/components/ErrorDetector'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.10:3000";

export const metadata: Metadata = {
  title: 'Kikoba Smart - Mfumo wa Akiba na Mikopo',
  description: 'Dhibiti akiba na mikopo ya kikundi chako kwa urahisi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <Script id="capacitor-auth-fix" strategy="beforeInteractive">
          {`
            (function() {
              var protocol = window.location.protocol;
              var isWeb = protocol === 'http:' || protocol === 'https:';
              var apiBaseUrl = "${API_URL}";

              if (!isWeb) {
                console.log('[NUCLEAR-FIX] Initializing polyfills...');
                
                var originalFetch = window.fetch;
                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
                  
                  if (url.indexOf('/api/auth/') !== -1 || url.indexOf('api/auth/') !== -1) {
                    var isLocal = url.indexOf('/') === 0 || url.indexOf('capacitor://') === 0 || url.indexOf('http://localhost') === 0;
                    if (isLocal && apiBaseUrl) {
                      var path = url;
                      if (url.indexOf('://') !== -1) {
                        try {
                          var urlObj = new URL(url);
                          path = urlObj.pathname + urlObj.search + urlObj.hash;
                        } catch (e) {
                          var parts = url.split('://');
                          if (parts.length > 1) {
                            var afterProtocol = parts[1];
                            path = '/' + afterProtocol.split('/').slice(1).join('/');
                          }
                        }
                      }
                      if (path.indexOf('/') !== 0) path = '/' + path;
                      var absoluteUrl = apiBaseUrl.replace(/\\/$/, '') + path;
                      console.log('[NUCLEAR-FIX] INTERCEPTED:', url, '->', absoluteUrl);
                      url = absoluteUrl;
                    }
                  }

                  var newInit = init || {};
                  if (newInit.keepalive && protocol === 'capacitor:') {
                    delete newInit.keepalive;
                    console.log('[NUCLEAR-FIX] Stripped keepalive');
                  }

                  return originalFetch(url, newInit);
                };

                if (apiBaseUrl) {
                  window.__NEXTAUTH = {
                    baseUrl: apiBaseUrl,
                    basePath: '/api/auth'
                  };
                }

                if (window.navigator) {
                  var originalSendBeacon = window.navigator.sendBeacon;
                  window.navigator.sendBeacon = function(url, data) {
                    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('https') === 0)) {
                      return originalSendBeacon ? originalSendBeacon.apply(this, [url, data]) : true;
                    }
                    console.log('[NUCLEAR-FIX] Suppressed beacon');
                    return true;
                  };
                }
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <ErrorDetector />
        </Providers>
      </body>
    </html>
  )
}

