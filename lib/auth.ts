import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import InstagramProvider from 'next-auth/providers/instagram';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const OAUTH_PROVIDERS = ['google', 'facebook', 'instagram'];

const providers: Provider[] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      username: { label: 'Username', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials.password) return null;
      const user = await prisma.user.findUnique({
        where: { username: credentials.username.toLowerCase().trim() },
      });
      if (!user || !user.passwordHash) return null;
      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;
      return {
        id: user.id,
        name: user.displayName,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      } as any;
    },
  }),
  // Passwordless demo sign-in for accounts created with email only.
  CredentialsProvider({
    id: 'email',
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      if (!email) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      // only passwordless accounts may sign in without a password
      if (!user || user.passwordHash !== '') return null;
      return {
        id: user.id,
        name: user.displayName,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      } as any;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}
if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
  providers.push(
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    })
  );
}

/** Find-or-create a local user for an OAuth (Google/Facebook/Instagram) profile. */
async function upsertOAuthUser(opts: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = opts.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  let base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 20);
  if (base.length < 3) base = `user${base}`;
  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${++suffix}`;
  }

  return prisma.user.create({
    data: {
      username,
      email,
      displayName: opts.name?.trim() || username,
      city: '',
      passwordHash: '',
      avatarUrl:
        opts.image ??
        `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(username)}&backgroundColor=f2e4d8`,
      credibilityScore: { create: {} },
    },
  });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers,
  callbacks: {
    async signIn({ account, user }) {
      if (account && OAUTH_PROVIDERS.includes(account.provider)) {
        // Instagram's API does not return an email — fall back to a synthetic one
        const email =
          user.email ?? `${account.providerAccountId}@${account.provider}.local`;
        await upsertOAuthUser({ email, name: user.name, image: user.image });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && OAUTH_PROVIDERS.includes(account.provider)) {
        const email = (
          user?.email ?? `${account.providerAccountId}@${account.provider}.local`
        ).toLowerCase();
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.displayName = dbUser.displayName;
          token.avatarUrl = dbUser.avatarUrl;
        }
      } else if (user) {
        token.userId = (user as any).id;
        token.username = (user as any).username;
        token.displayName = (user as any).displayName;
        token.avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        userId: token.userId as string,
        username: token.username as string,
        displayName: token.displayName as string,
        avatarUrl: (token.avatarUrl as string | null) ?? null,
      };
      return session;
    },
  },
};
