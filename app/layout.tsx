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

                console.log('[DEBUG-AUTH] Transparent Proxy Bootstrap. Native:', isNative, 'Base:', apiBaseUrl);

                var OriginalRequest = window.Request;
                var originalFetch = window.fetch;

                function getRedirection(url) {
                  if (!url || typeof url !== 'string') return url;
                  // Redirect ANY /api/ call in native environment
                  var isApi = url.indexOf('/api/') !== -1;
                  var isLocal = url.indexOf('/') === 0 || 
                                url.indexOf('capacitor://') === 0 || 
                                url.indexOf('http://localhost') === 0;

                  if (isNative && isApi && (isLocal || !url.match(/^https?:/))) {
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

                function rewriteContent(content) {
                  if (typeof content !== 'string') return content;
                  if (content.indexOf(apiBaseUrl) === -1) return content;
                  
                  console.log('[DEBUG-AUTH] REWRITING CONTENT (Found absolute IP)');
                  // Replace absolute backend URL with relative path /
                  var escapedBase = apiBaseUrl.replace(/[.*+?^$\\{()|[\\]\\\\]/g, '\\\\$&');
                  var re = new RegExp(escapedBase, 'g');
                  return content.replace(re, '');
                }

                // Super Proxy for options/init objects
                function createOptionsProxy(options) {
                  if (!options || typeof options !== 'object') return options;
                  
                  return new Proxy(options, {
                    get: function(target, prop) {
                      if (prop === 'keepalive' && isNative) return false;
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
                    if (isNative) {
                      Object.defineProperty(req, 'keepalive', { value: false, writable: false });
                    }
                    return req;
                  } catch (e) {
                    return new OriginalRequest(input, init);
                  }
                };
                window.Request.prototype = OriginalRequest.prototype;

                // Override fetch with Response Rewriting
                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var newUrl = getRedirection(url);
                  var proxiedInit = createOptionsProxy(init);

                  return originalFetch(newUrl || input, proxiedInit).then(function(response) {
                    if (!isNative || !newUrl || newUrl === url) return response;

                    // Intercept and rewrite response body
                    var originalJson = response.json;
                    var originalText = response.text;

                    response.json = function() {
                      return originalJson.call(response).then(function(data) {
                        var jsonStr = JSON.stringify(data);
                        var rewritten = rewriteContent(jsonStr);
                        if (rewritten !== jsonStr) {
                          console.log('[DEBUG-AUTH] REWRITTEN JSON BODY');
                          return JSON.parse(rewritten);
                        }
                        return data;
                      });
                    };

                    response.text = function() {
                      return originalText.call(response).then(function(text) {
                        return rewriteContent(text);
                      });
                    };

                    return response;
                  });
                };

                // Definitively kill sendBeacon
                try {
                  var noop = function() { return true; };
                  if (window.navigator) window.navigator.sendBeacon = noop;
                  if (window.Navigator && window.Navigator.prototype) window.Navigator.prototype.sendBeacon = noop;
                } catch (e) {}

                // Block ALL external navigation attempts
                if (isNative) {
                   window.addEventListener('beforeunload', function(e) {
                      // If we are navigating away from capacitor://, try to stop it
                      // Note: This is limited in some browsers but can help
                      console.log('[DEBUG-NAV] Navigation attempt detected');
                   });
                }

                window.__NEXTAUTH = { baseUrl: '/', basePath: '/api/auth' };
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

