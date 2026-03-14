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
                  var url;
                  var options = init || {};

                  if (typeof input === 'string') {
                    url = input;
                  } else if (input instanceof URL) {
                    url = input.toString();
                  } else {
                    // It's a Request object
                    url = input.url;
                    // For Request objects, we need to extract options to modify them
                    // Note: This is an approximation since Request properties are read-only
                    // but fetch will use the merged options from init.
                  }
                  
                  // Match /api/auth or api/auth
                  var isAuth = url.indexOf('api/auth/') !== -1;
                  var isLocal = url.indexOf('/') === 0 || 
                                url.indexOf('capacitor://') === 0 || 
                                url.indexOf('http://localhost') === 0;

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
                    
                    // If input was a string or URL, we just replace it
                    if (typeof input === 'string' || input instanceof URL) {
                      input = absoluteUrl;
                    } else {
                      // If input was a Request, we need to recreate it because url is read-only
                      try {
                        input = new Request(absoluteUrl, input);
                      } catch (e) {
                        console.error('[DEBUG-AUTH] Re-request failed', e);
                        // Fallback to string if Request constructor fails
                        input = absoluteUrl;
                      }
                    }
                  }

                  // Strip keepalive in native environment to prevent "Beacons only over HTTP(S)" error
                  if (isNative && options.keepalive) {
                    console.log('[DEBUG-AUTH] Stripping keepalive from request');
                    delete options.keepalive;
                  }

                  return originalFetch(input, options);
                };

                // sendBeacon fallback - replace on prototype if possible or directly on instance
                try {
                  var beaconHandler = function(url, data) {
                    console.log('[DEBUG-BEACON] Intercepted:', url);
                    if (typeof url === 'string' && !url.match(/^https?:/)) {
                      console.warn('[DEBUG-BEACON] Blocking non-http beacon to prevent crash');
                      return true; // Pretend it was sent
                    }
                    return true; 
                  };

                  if (window.Navigator && window.Navigator.prototype) {
                    window.Navigator.prototype.sendBeacon = beaconHandler;
                  }
                  if (window.navigator) {
                    window.navigator.sendBeacon = beaconHandler;
                  }
                } catch (e) {
                  console.error('[DEBUG-BEACON] Failed to polyfill sendBeacon', e);
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

