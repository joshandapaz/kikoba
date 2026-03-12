import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/loans/:path*',
    '/savings/:path*',
    '/group/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
}
