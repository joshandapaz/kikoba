import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Phone Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null
        
        // Support eithe plain phone or email in the 'phone' field
        const loginId = credentials.phone;
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`phone.eq.${loginId},email.eq.${loginId}`)
          .single()
  
        if (!user) {
          console.error(`[AUTH] User not found for: ${loginId}`);
          return null
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatar_url,
          phone: user.phone
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = user.image
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        (session.user as any).phone = token.phone as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Use lax for better cross-site support on local IP
        path: '/',
        secure: false, // Force false even in 'production' build for local IP testing
      },
    },
  },
}
