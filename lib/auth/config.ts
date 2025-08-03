// lib/auth/config.ts
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  // إعدادات الصفحات المخصصة
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register', // صفحة تسجيل مستخدم جديد
  },
  
  // إعدادات الجلسة
  session: {
    strategy: 'jwt', // استخدام استراتيجية JWT
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
    updateAge: 24 * 60 * 60, // تحديث الجلسة يومياً
  },
  
  // موفري المصادقة
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true, // ربط حسابات بنفس البريد
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  
  // السر السري لتوقيع الـ JWT
  secret: process.env.NEXTAUTH_SECRET as string,
  
  // ردود الاتصال (Callbacks)
  callbacks: {
    // التحقق من الصلاحيات
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/settings',
        '/admin',
        '/moderator'
      ];
      
      // التحقق إذا كان المسار محميًا
      const isProtectedRoute = protectedRoutes.some(route => 
        nextUrl.pathname.startsWith(route)
      );
      
      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // إعادة توجيه غير المسجلين للصفحة العامة
      }
      
      // توجيه المسجلين بعيدًا عن صفحات التسجيل/الدخول
      const authRoutes = ['/login', '/register', '/reset-password'];
      if (isLoggedIn && authRoutes.includes(nextUrl.pathname)) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
    
    // تحديث بيانات الـ JWT
    async jwt({ token, user, trigger, session }) {
      // عند تسجيل الدخول
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      
      // عند تحديث الجلسة من العميل
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    
    // تحديث بيانات الجلسة
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    
    // تحديث بيانات المستخدم بعد المصادقة
    async signIn({ user, account, profile }) {
      // التحقق من البريد الإلكتروني للمستخدمين الجدد
      if (account?.provider !== 'credentials' && !user.emailVerified) {
        return '/login?error=email-not-verified';
      }
      
      // السماح بالدخول لجميع المستخدمين
      return true;
    },
  },
  
  // الأحداث
  events: {
    async linkAccount({ user, account }) {
      console.log(`تم ربط حساب ${account.provider} للمستخدم ${user.email}`);
    },
    async createUser({ user }) {
      console.log(`تم إنشاء مستخدم جديد: ${user.email}`);
    },
  },
  
  // إعدادات التصحيح
  debug: process.env.NODE_ENV === 'development',
};