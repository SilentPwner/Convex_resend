// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { ConvexAdapter } from "@next-auth/convex-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/lib/auth/config";
import { createOrUpdateUser, getByEmail } from "@/convex/users";
import { ConvexHttpClient } from "convex/browser";

// تهيئة عميل Convex
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: ConvexAdapter(),
  providers: [
    ...authConfig.providers, // الحفاظ على موفري OAuth الأصليين
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // 1. التحقق من وجود بيانات الاعتماد
          if (!credentials?.email || !credentials?.password) {
            throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
          }

          // 2. جلب المستخدم من Convex
          const user = await convex.query(getByEmail, {
            email: credentials.email as string,
          });

          // 3. التحقق من وجود المستخدم وكلمة المرور
          if (!user || !user.password) {
            throw new Error("بيانات الاعتماد غير صحيحة");
          }

          // 4. التحقق من التحقق من البريد الإلكتروني
          if (!user.emailVerified) {
            throw new Error("الرجاء التحقق من بريدك الإلكتروني أولاً");
          }

          // 5. مقارنة كلمة المرور المشفرة
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            throw new Error("بيانات الاعتماد غير صحيحة");
          }

          // 6. إرجاع بيانات المستخدم المطلوبة للجلسة
          return {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.imageUrl,
            clerkUserId: user.clerkUserId || null,
          };
        } catch (error) {
          console.error("فشل المصادقة:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks, // الحفاظ على callbacks الأصلية
    async jwt({ token, user, trigger, session }) {
      // تحديث الـ token عند تسجيل الدخول أو تحديث الجلسة
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clerkUserId = user.clerkUserId;
      }
      
      // تحديث الـ token عند تحديث الجلسة من العميل
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      // مزامنة المستخدم مع قاعدة البيانات
      if (token.email) {
        const dbUser = await createOrUpdateUser({
          email: token.email as string,
          name: session.user?.name || token.name as string,
          imageUrl: session.user?.image || token.picture as string,
          clerkId: token.clerkUserId as string || null,
        });

        // إضافة البيانات الإضافية للجلسة
        if (session.user) {
          session.user.role = dbUser.role;
          session.user.id = dbUser._id;
          session.user.clerkId = token.clerkUserId as string || null;
        }
      }
      
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        // تحديث آخر وقت دخول عند تسجيل الدخول الناجح
        await convex.mutation("users:updateLastLogin", {
          userId: user.id,
          lastLogin: new Date().toISOString(),
        });
      } catch (error) {
        console.error("فشل تحديث آخر دخول:", error);
      }
    },
    async linkAccount({ user, account }) {
      try {
        // تحديث بيانات الحساب المرتبط
        await convex.mutation("users:updateProviderAccount", {
          userId: user.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });
      } catch (error) {
        console.error("فشل تحديث حساب المزود:", error);
      }
    },
  },
  session: {
    strategy: "jwt", // استخدام استراتيجية JWT لإدارة الجلسات
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
  },
});