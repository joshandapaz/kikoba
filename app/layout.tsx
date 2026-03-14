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
                var isNative = window.location.protocol === 'capacitor:' || window.location.href.indexOf('capacitor://') === 0;
                var apiBaseUrl = "${API_URL}" || "http://192.168.1.10:3000";

                console.log('[DEBUG-AUTH] Super Proxy Bootstrap. Native:', isNative, 'Base:', apiBaseUrl);

                var OriginalRequest = window.Request;
                var originalFetch = window.fetch;

                function getRedirection(url) {
                  if (!url || typeof url !== 'string') return url;
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
                    return absoluteUrl;
                  }
                  return url;
                }

                // Super Proxy for options/init objects
                function createOptionsProxy(options) {
                  if (!options || typeof options !== 'object') return options;
                  
                  return new Proxy(options, {
                    get: function(target, prop) {
                      if (prop === 'keepalive' && isNative) {
                        console.log('[DEBUG-AUTH] Proxy blocked keepalive access');
                        return false;
                      }
                      return target[prop];
                    },
                    has: function(target, prop) {
                      if (prop === 'keepalive' && isNative) return false;
                      return prop in target;
                    }
                  });
                }

                // Override Request constructor
                window.Request = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var newUrl = getRedirection(url);
                  var proxiedInit = createOptionsProxy(init);
                  
                  try {
                    var req = new OriginalRequest(newUrl || input, proxiedInit);
                    // Also define keepalive as false on the instance if it's native
                    if (isNative) {
                      Object.defineProperty(req, 'keepalive', { value: false, writable: false });
                    }
                    return req;
                  } catch (e) {
                    return new OriginalRequest(input, init);
                  }
                };
                window.Request.prototype = OriginalRequest.prototype;

                // Override fetch
                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var newUrl = getRedirection(url);
                  var proxiedInit = createOptionsProxy(init);

                  // If input is already a Request object, we might need to recreate it
                  if (typeof input === 'object' && input !== null && !(input instanceof URL) && input.url) {
                    if (isNative && input.keepalive) {
                      try {
                        input = new Request(input, { keepalive: false });
                      } catch (e) {
                        input = input.url;
                      }
                    } else if (newUrl !== url) {
                      try {
                        input = new Request(newUrl, input);
                      } catch (e) {
                        input = newUrl;
                      }
                    }
                  }

                  return originalFetch(newUrl || input, proxiedInit);
                };

                // Definitively kill sendBeacon
                try {
                  var noop = function() { return true; };
                  if (window.navigator) window.navigator.sendBeacon = noop;
                  if (window.Navigator && window.Navigator.prototype) window.Navigator.prototype.sendBeacon = noop;
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

