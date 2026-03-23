export const dynamic = 'force-dynamic'
process.env.NEXTAUTH_URL = 'http://192.168.0.101:5172';
process.env.NEXTAUTH_SECRET = 'kikoba-smart-super-secret-key-2024';

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

