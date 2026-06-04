import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /auth/* (sign in / sign up)
     * - /api/auth/* (NextAuth)
     * - /api/register (sign up endpoint)
     * - Next.js internals and static assets
     */
    '/((?!auth|api/auth|api/register|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)',
  ],
};
