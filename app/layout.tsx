import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ErrorDetector from '@/components/ErrorDetector'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.101:3000";

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
                var apiBaseUrl = "${API_URL}" || "http://192.168.0.101:3000";

                console.log('[DEBUG-AUTH] Nucleus Bootstrap. Native:', isNative, 'Base:', apiBaseUrl);

                var OriginalRequest = window.Request;
                var originalFetch = window.fetch;

                function getRedirection(url) {
                  if (!url || typeof url !== 'string') return url;
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
                  console.log('[DEBUG-AUTH] REWRITING CONTENT');
                  var escapedBase = apiBaseUrl.replace(/[.*+?^$\\{()|[\\]\\\\]/g, '\\\\$&');
                  var re = new RegExp(escapedBase, 'g');
                  return content.replace(re, '');
                }

                function scrubInit(init) {
                  var options = init || {};
                  if (typeof options !== 'object' || options === null) return options;
                  
                  // Defensive copy to avoid mutating frozen/sealed objects
                  var scrubbed = {};
                  for (var key in options) { scrubbed[key] = options[key]; }
                  
                  if (isNative && 'keepalive' in scrubbed) {
                    console.log('[DEBUG-AUTH] SCRUBBED KEEPALIVE');
                    delete scrubbed.keepalive;
                    Object.defineProperty(scrubbed, 'keepalive', { value: false, writable: false, enumerable: true });
                  }
                  return scrubbed;
                }

                window.Request = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var redirectUrl = getRedirection(url);
                  var scrubbedInit = scrubInit(init);
                  
                  // If input is a Request object, we must extract its properties
                  if (input instanceof OriginalRequest) {
                    scrubbedInit.method = scrubbedInit.method || input.method;
                    scrubbedInit.headers = scrubbedInit.headers || input.headers;
                    scrubbedInit.mode = scrubbedInit.mode || input.mode;
                    scrubbedInit.credentials = scrubbedInit.credentials || input.credentials;
                    scrubbedInit.cache = scrubbedInit.cache || input.cache;
                    scrubbedInit.redirect = scrubbedInit.redirect || input.redirect;
                    scrubbedInit.referrer = scrubbedInit.referrer || input.referrer;
                    scrubbedInit.integrity = scrubbedInit.integrity || input.integrity;
                    // We can't easily clone body if it's already used, but we try url fallback
                  }

                  try {
                    var req = new OriginalRequest(redirectUrl || url, scrubbedInit);
                    if (isNative) {
                      Object.defineProperty(req, 'keepalive', { value: false, writable: false });
                    }
                    return req;
                  } catch (e) {
                    return new OriginalRequest(input, init);
                  }
                };
                window.Request.prototype = OriginalRequest.prototype;

                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var redirectUrl = getRedirection(url);
                  var scrubbedInit = scrubInit(init);

                  // Extract from Request if needed
                  if (input instanceof OriginalRequest) {
                    scrubbedInit.method = scrubbedInit.method || input.method;
                    scrubbedInit.headers = scrubbedInit.headers || input.headers;
                    scrubbedInit.credentials = scrubbedInit.credentials || input.credentials;
                  }

                  return originalFetch(redirectUrl || input, scrubbedInit).then(function(response) {
                    if (!isNative || !redirectUrl || redirectUrl === url) return response;

                    var originalJson = response.json;
                    var originalText = response.text;

                    response.json = function() {
                      return originalJson.call(response).then(function(data) {
                        var jsonStr = JSON.stringify(data);
                        var rewritten = rewriteContent(jsonStr);
                        return rewritten !== jsonStr ? JSON.parse(rewritten) : data;
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

                try {
                  var noop = function() { return true; };
                  if (window.navigator) window.navigator.sendBeacon = noop;
                  if (window.Navigator && window.Navigator.prototype) window.Navigator.prototype.sendBeacon = noop;
                } catch (e) {}

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

