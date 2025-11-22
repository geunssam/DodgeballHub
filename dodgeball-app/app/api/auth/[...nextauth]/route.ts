import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/teacher/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // ✅ 개인정보 동의 전에는 DB에 저장하지 않음
      // 동의 후 PrivacyConsentGuard에서 저장됨
      return true;
    },
    async session({ session, token }) {
      // 세션에 사용자 정보 추가
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // JWT 토큰에 정보 추가
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
