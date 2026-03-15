import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const { db } = await import("@/db");
        const schema = await import("@/db/schema");
        const userTable = schema.user;
        const { eq } = await import("drizzle-orm");
        const bcrypt = await import("bcryptjs");
        const [existing] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, email))
          .limit(1);
        if (!existing?.password) return null;
        const ok = await bcrypt.compare(password, existing.password);
        if (!ok) return null;
        return {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          image: existing.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
});
