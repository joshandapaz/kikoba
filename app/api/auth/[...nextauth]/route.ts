export const dynamic = 'force-dynamic'
export function generateStaticParams() { return []; }
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
