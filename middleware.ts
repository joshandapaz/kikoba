import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin!)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
