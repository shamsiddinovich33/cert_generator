import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    // Providers array will be empty here, populated in auth.ts to avoid Prisma edge runtime issues
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith('/api');
      const isAuthRoute = nextUrl.pathname.startsWith('/auth');

      // Unprotected routes
      if (nextUrl.pathname === '/') return true;

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isApiRoute) {
        return Response.redirect(new URL('/auth/login', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
