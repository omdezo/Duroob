import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// In-memory user store (replaced by DB when DATABASE_URL is set)
// Pre-seeded with an admin user
const users = new Map<string, { id: string; email: string; name: string; password: string; role: string; image?: string }>();

// Seed default admin
const adminHash = bcrypt.hashSync('admin123', 10);
users.set('admin@duroob.om', {
  id: '1',
  email: 'admin@duroob.om',
  name: 'Admin',
  password: adminHash,
  role: 'admin',
});

export function getUsers() { return users; }

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        const user = users.get(email);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'user';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});
