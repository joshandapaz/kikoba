try { require('dotenv').config(); } catch (e) {}
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
        
        const loginId = credentials.phone;
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`phone.eq.${loginId},email.eq.${loginId}`)
          .single()
  
        if (!user) return null
        
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
        session.user.id = (token as any).id
        session.user.image = (token as any).image
        (session.user as any).phone = (token as any).phone
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: 'kikoba-smart-super-secret-key-2024',
  cookies: {
    sessionToken: {
      name: `kikoba-auth-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
  },
}
