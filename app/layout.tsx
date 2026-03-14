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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var protocol = window.location.protocol;
                var isWeb = protocol === 'http:' || protocol === 'https:';
                var apiBaseUrl = "${API_URL}";

                if (!isWeb) {
                  console.log('[FINAL-NUCLEAR-FIX] Initializing...');
                  
                  var originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
                    
                    // Match /api/auth anywhere in the URL if it's hitting localhost/relative
                    if (url.indexOf('/api/auth/') !== -1 || url.indexOf('api/auth/') !== -1) {
                      var isLocal = url.indexOf('/') === 0 || url.indexOf('capacitor://') === 0 || url.indexOf('http://localhost') === 0;
                      
                      if (isLocal) {
                        var path = url;
                        if (url.indexOf('://') !== -1) {
                          try {
                            var urlObj = new URL(url);
                            path = urlObj.pathname + urlObj.search + urlObj.hash;
                          } catch (e) {
                            var parts = url.split('://');
                            if (parts.length > 1) {
                              var afterProtocol = parts[1];
                              var slashIdx = afterProtocol.indexOf('/');
                              path = (slashIdx !== -1) ? afterProtocol.substring(slashIdx) : '/';
                            }
                          }
                        }
                        
                        if (path.indexOf('/') !== 0) path = '/' + path;
                        
                        if (apiBaseUrl) {
                          var absoluteUrl = apiBaseUrl.replace(/\\/$/, '') + path;
                          console.log('[FINAL-NUCLEAR-FIX] INTERCEPTED:', url, '->', absoluteUrl);
                          url = absoluteUrl;
                        } else {
                          console.error('[FINAL-NUCLEAR-FIX] CRITICAL ERROR: apiBaseUrl is missing for path:', path);
                        }
                      }
                    }

                    var newInit = init || {};
                    if (newInit.keepalive && protocol === 'capacitor:') {
                      delete newInit.keepalive;
                      console.log('[FINAL-NUCLEAR-FIX] Stripped keepalive');
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
                      console.log('[FINAL-NUCLEAR-FIX] Suppressed beacon');
                      return true;
                    };
                  }
                }
              })();
            `,
          }}
        />
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

