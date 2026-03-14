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
                var isNative = protocol === 'capacitor:' || window.location.href.indexOf('capacitor://') === 0;
                var apiBaseUrl = "${API_URL}" || "http://192.168.1.10:3000";

                console.log('[DEBUG-AUTH] Bootstrap. Native:', isNative, 'Base:', apiBaseUrl);

                // Nuclear interceptor
                var originalFetch = window.fetch;
                var customFetch = function(input, init) {
                  var url;
                  var options = init || {};
                  var isRequest = typeof input === 'object' && input !== null && !(input instanceof URL) && 'url' in input;

                  if (typeof input === 'string') {
                    url = input;
                  } else if (input instanceof URL) {
                    url = input.toString();
                  } else if (isRequest) {
                    url = input.url;
                  }
                  
                  // Match /api/auth or api/auth
                  var isAuth = url && url.indexOf('api/auth/') !== -1;
                  var isLocal = url && (url.indexOf('/') === 0 || 
                                url.indexOf('capacitor://') === 0 || 
                                url.indexOf('http://localhost') === 0);

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
                    
                    if (isRequest) {
                      try {
                        input = new Request(absoluteUrl, input);
                      } catch (e) {
                        input = absoluteUrl; // Fallback
                      }
                    } else {
                      input = absoluteUrl;
                    }
                  }

                  // Strip keepalive in native environment to prevent "Beacons only over HTTP(S)" error
                  // We MUST do this for both init options AND the Request object
                  if (isNative) {
                    var hasKeepAlive = options.keepalive || (isRequest && input.keepalive);
                    if (hasKeepAlive) {
                      console.log('[DEBUG-AUTH] Stripping keepalive from', url);
                      options.keepalive = false;
                      if (isRequest) {
                        try {
                          // Recreating the request without keepalive
                          input = new Request(input, { keepalive: false });
                        } catch (e) {
                          // If it fails, use the URL string instead
                          input = typeof input === 'string' ? input : input.url;
                        }
                      }
                    }
                  }

                  return originalFetch(input, options);
                };

                // Define it non-configurably if possible to prevent other scripts from overriding
                try {
                  window.fetch = customFetch;
                } catch (e) {
                  console.error('[DEBUG-AUTH] Failed to override fetch', e);
                }

                // sendBeacon fallback
                try {
                  var beaconHandler = function(url, data) {
                    console.log('[DEBUG-BEACON] Intercepted:', url);
                    return true;
                  };
                  if (window.navigator) {
                    window.navigator.sendBeacon = beaconHandler;
                  }
                  if (window.Navigator && window.Navigator.prototype) {
                    window.Navigator.prototype.sendBeacon = beaconHandler;
                  }
                } catch (e) {}

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

