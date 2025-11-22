import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createOrUpdateTeacher } from '@/lib/firestoreService';

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
      // Google 로그인 성공 시 Firestore에 교사 정보 저장/업데이트
      if (user.email && user.id) {
        try {
          await createOrUpdateTeacher(user.id, {
            email: user.email,
            name: user.name || '',
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error saving teacher to Firestore:', error);
          // 로그인은 계속 진행 (Firestore 오류가 로그인을 막지 않도록)
        }
      }
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
