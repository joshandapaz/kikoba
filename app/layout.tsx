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
                var isNative = protocol === 'capacitor:';
                var apiBaseUrl = "${API_URL}";

                console.log('[DEBUG-AUTH] Bootstrap. Native:', isNative, 'Base:', apiBaseUrl);

                // Nuclear interceptor
                var originalFetch = window.fetch;
                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
                  
                  // LOG EVERYTHING on mobile for tracing
                  if (isNative) {
                    console.log('[DEBUG-FETCH] Request:', url);
                  }

                  // Match /api/auth or api/auth
                  var isAuth = url.indexOf('api/auth/') !== -1;
                  var isLocal = url.indexOf('/') === 0 || url.indexOf('capacitor://') === 0 || url.indexOf('http://localhost') === 0;

                  if (isAuth && (isLocal || !url.match(/^https?:/)) && apiBaseUrl) {
                    var path = url;
                    if (url.indexOf('://') !== -1) {
                      try {
                        var urlObj = new URL(url);
                        path = urlObj.pathname + urlObj.search + urlObj.hash;
                      } catch (e) {
                        var parts = url.split('://');
                        path = parts.length > 1 ? parts[1].substring(parts[1].indexOf('/')) : url;
                      }
                    } else if (url.indexOf('/') !== 0) {
                      path = '/' + url;
                    }
                    
                    var absoluteUrl = apiBaseUrl.replace(/\\/$/, '') + (path.indexOf('/') === 0 ? path : '/' + path);
                    console.log('[DEBUG-AUTH] REDIRECT:', url, '->', absoluteUrl);
                    url = absoluteUrl;
                  }

                  var newInit = init || {};
                  if (newInit.keepalive && isNative) {
                    console.log('[DEBUG-AUTH] Stripping keepalive');
                    delete newInit.keepalive;
                  }

                  return originalFetch(url, newInit);
                };

                // sendBeacon fallback
                if (window.navigator) {
                  var originalSendBeacon = window.navigator.sendBeacon;
                  window.navigator.sendBeacon = function(url, data) {
                    console.log('[DEBUG-BEACON] Attempt:', url);
                    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('https') === 0)) {
                      return originalSendBeacon ? originalSendBeacon.apply(this, [url, data]) : true;
                    }
                    return true;
                  };
                }

                if (apiBaseUrl) {
                  window.__NEXTAUTH = { baseUrl: apiBaseUrl, basePath: '/api/auth' };
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

