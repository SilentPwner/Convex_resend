// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth/config';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  // 1. التحقق من المصادقة باستخدام NextAuth
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // 2. الصفحات العامة المسموح الوصول إليها بدون تسجيل
  const publicRoutes = ['/', '/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  // 3. إذا لم يكن مسجلاً الدخول ويحاول الوصول لصفحة خاصة
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // 4. التحقق من دور المشرف لصفحات الإدمن
  if (req.nextUrl.pathname.startsWith('/admin') && session) {
    // في تطبيق حقيقي، يجب جلب دور المستخدم من قاعدة البيانات
    // هنا نستخدم قيمة وهمية لأغراض التوضيح
    const isAdmin = session.role === 'admin'; 
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // 5. التحقق من أن المستخدم المؤكد البريد فقط يمكنه الوصول لصفحات معينة
  const protectedAfterVerification = ['/settings', '/donate'];
  if (protectedAfterVerification.includes(req.nextUrl.pathname) && session) {
    if (!session.emailVerified) {
      return NextResponse.redirect(new URL('/verify-email', req.url));
    }
  }
  
  // 6. تحميل تكوين NextAuth
  const nextAuthMiddleware = NextAuth(authConfig).auth;
  
  // 7. تطبيق middleware الخاص بـ NextAuth
  return nextAuthMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/settings',
    '/donate'
  ],
};