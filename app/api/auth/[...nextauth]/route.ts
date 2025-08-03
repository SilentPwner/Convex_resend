// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ConvexHttpClient } from 'convex/browser';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/lib/auth/config';

// تهيئة عميل Convex
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const authOptions = {
  ...authConfig, // دمج الإعدادات الأساسية من ملف config
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // 1. التحقق من وجود بيانات الاعتماد
          if (!credentials?.email || !credentials?.password) {
            throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
          }

          // 2. جلب المستخدم من Convex
          const user = await convex.query('users:getByEmail', { 
            email: credentials.email 
          });

          // 3. التحقق من وجود المستخدم وكلمة المرور
          if (!user || !user.password) {
            throw new Error('بيانات الاعتماد غير صحيحة');
          }

          // 4. التحقق من التحقق من البريد الإلكتروني
          if (!user.emailVerified) {
            throw new Error('الرجاء التحقق من بريدك الإلكتروني أولاً');
          }

          // 5. مقارنة كلمة المرور المشفرة
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            throw new Error('بيانات الاعتماد غير صحيحة');
          }

          // 6. إرجاع بيانات المستخدم المطلوبة للجلسة
          return {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };

        } catch (error) {
          console.error('فشل المصادقة:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks, // الحفاظ على callbacks الأصلية
    async jwt({ token, user }) {
      // 1. دمج بيانات المستخدم في الـ token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // 2. إضافة البيانات الإضافية للجلسة
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // 3. تحديث آخر وقت دخول عند تسجيل الدخول الناجح
      try {
        await convex.mutation('users:updateLastLogin', {
          userId: user.id,
          lastLogin: new Date().toISOString(),
        });
      } catch (error) {
        console.error('فشل تحديث آخر دخول:', error);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };