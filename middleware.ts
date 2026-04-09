import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth } from 'next-auth/middleware'

const logMiddleware = (msg: string) => {
  // Console logging is allowed, but fs is not.
  console.log(`[MIDDLEWARE] ${new Date().toISOString()} ${msg}`)
}

const allowedOrigins = [
  'capacitor://localhost', 
  'http://localhost:5172',
  'http://192.168.0.101:5172'
]

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (origin.startsWith('capacitor://')) return true
  if (allowedOrigins.includes(origin)) return true
  if (origin.endsWith('.netlify.app')) return true
  return false
}

export default async function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const isAllowed = isAllowedOrigin(origin)
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    if (isAllowed) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin!,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
  }

  const response = NextResponse.next()

  // Add CORS headers to all responses
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin!)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/loans/:path*',
    '/savings/:path*',
    '/group/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
}
