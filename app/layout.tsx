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
                var isWeb = window.location.protocol === 'http:' || window.location.protocol === 'https:';
                var isNative = !isWeb;
                var apiBaseUrl = "${API_URL}" || "http://192.168.0.101:3000";

                console.log('[DEBUG-NET] BRIDGE V6. Protocol:', window.location.protocol, 'Native:', isNative);

                // Quick Connection Probe
                if (isNative) {
                  fetch(apiBaseUrl + '/api/auth/session').then(function(r) {
                    console.log('[DEBUG-NET] PROBE:', r.status === 200 ? 'SUCCESS' : 'STATUS ' + r.status);
                  }).catch(function(e) {
                    console.error('[DEBUG-NET] PROBE FAIL:', e.message);
                  });
                }

                var OriginalRequest = window.Request;
                var originalFetch = window.fetch;

                // GLOBAL KEEPALIVE KILLER
                if (isNative) {
                  try {
                    Object.defineProperty(OriginalRequest.prototype, 'keepalive', {
                      get: function() { return false; },
                      configurable: false,
                      enumerable: true
                    });
                    console.log('[DEBUG-NET] KEEPALIVE KILLED ON PROTOTYPE');
                  } catch (e) {
                    console.warn('[DEBUG-NET] PROTO KILL FAIL');
                  }
                }

                function getRedirection(url) {
                  if (!url || typeof url !== 'string') return url;
                  var isApi = url.indexOf('/api/') !== -1;
                  var isAbsolute = url.match(/^https?:/);

                  if (isNative && isApi && !isAbsolute) {
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
                    var abs = apiBaseUrl.replace(/\\/$/, '') + (path.indexOf('/') === 0 ? path : '/' + path);
                    console.log('[DEBUG-NET] REDIRECT:', url, '->', abs);
                    return abs;
                  }
                  return url;
                }

                function rewriteContent(content) {
                  if (typeof content !== 'string') return content;
                  if (content.indexOf(apiBaseUrl) === -1) return content;
                  var escapedBase = apiBaseUrl.replace(/[.*+?^$\\{()|[\\]\\\\]/g, '\\\\$&');
                  var re = new RegExp(escapedBase, 'g');
                  return content.replace(re, '');
                }

                function scrubInit(init) {
                  var options = init || {};
                  if (typeof options !== 'object' || options === null) return options;
                  var scrubbed = {};
                  for (var key in options) { scrubbed[key] = options[key]; }
                  if (isNative) {
                    scrubbed.keepalive = false;
                  }
                  return scrubbed;
                }

                window.Request = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var redirectUrl = getRedirection(url);
                  var scrubbedInit = scrubInit(init);
                  
                  if (input instanceof OriginalRequest) {
                    ['method', 'headers', 'mode', 'credentials', 'cache', 'redirect', 'referrer', 'integrity'].forEach(function(p) {
                      if (!(p in scrubbedInit)) {
                         try { scrubbedInit[p] = input[p]; } catch(e) {}
                      }
                    });
                  }

                  try {
                    var req = new OriginalRequest(redirectUrl || url, scrubbedInit);
                    return req;
                  } catch (e) {
                    console.error('[DEBUG-NET] REQ ERR:', e.message);
                    return new OriginalRequest(input, init);
                  }
                };
                window.Request.prototype = OriginalRequest.prototype;

                window.fetch = function(input, init) {
                  var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input.url || ''));
                  var redirectUrl = getRedirection(url);
                  var scrubbedInit = scrubInit(init);

                  if (input instanceof OriginalRequest) {
                    ['method', 'headers', 'credentials'].forEach(function(p) {
                      if (!(p in scrubbedInit)) {
                         try { scrubbedInit[p] = input[p]; } catch(e) {}
                      }
                    });
                  }

                  return originalFetch(redirectUrl || input, scrubbedInit).then(function(response) {
                    if (redirectUrl && redirectUrl !== url) {
                       console.log('[DEBUG-NET] DONE:', url, '->', response.status);
                    }
                    if (!isNative || !redirectUrl || redirectUrl === url) return response;

                    var originalJson = response.json;
                    var originalText = response.text;

                    response.json = function() {
                      return originalJson.call(response).then(function(data) {
                        try {
                          var jsonStr = JSON.stringify(data);
                          var rewritten = rewriteContent(jsonStr);
                          return rewritten !== jsonStr ? JSON.parse(rewritten) : data;
                        } catch (e) {
                          return data;
                        }
                      }).catch(function(err) {
                        console.error('[DEBUG-NET] JSON FAIL (Likely HTML):', err.message);
                        throw err;
                      });
                    };

                    response.text = function() {
                      return originalText.call(response).then(function(text) {
                        return rewriteContent(text);
                      });
                    };

                    return response;
                  }).catch(function(err) {
                    console.error('[DEBUG-NET] FETCH ERR:', url, err.message);
                    throw err;
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

