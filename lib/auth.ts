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
        const fs = require('fs');
        const log = (msg: string) => fs.appendFileSync('c:\\Users\\HP\\Desktop\\anti\\auth-debug.log', `[${new Date().toISOString()}] ${msg}\n`);
        
        log(`Authorize attempt for: ${credentials?.phone}`);
        if (!credentials?.phone || !credentials?.password) {
          log('Missing credentials');
          return null
        }
        
        if (!supabaseAdmin) {
          log('ERROR: supabaseAdmin is NULL!');
          return null
        }

        const loginId = credentials.phone;
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`phone.eq.${loginId},email.eq.${loginId}`)
          .single()
  
        if (error || !user) {
          log(`User not found or error: ${error?.message || 'User not found'}`);
          return null
        }
        
        log(`User found: ${user.phone}, comparing passwords...`);
        const isValid = await bcrypt.compare(credentials.password, user.password)
        log(`Password match: ${isValid}`);

        if (!isValid) {
          return null
        }
        
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
      const fs = require('fs');
      const log = (msg: string) => fs.appendFileSync('c:\\Users\\HP\\Desktop\\anti\\auth-debug.log', `[JWT CALLBACK] ${new Date().toISOString()} ${msg}\n`);
      
      log(`JWT Callback: user present: ${!!user}, token.id: ${token?.id || 'none'}`);
      if (user) {
        token.id = user.id
        token.image = user.image
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      const fs = require('fs');
      const log = (msg: string) => fs.appendFileSync('c:\\Users\\HP\\Desktop\\anti\\auth-debug.log', `[SESSION CALLBACK] ${new Date().toISOString()} ${msg}\n`);
      
      log(`Session Callback: token.id: ${token?.id || 'none'}`);
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
