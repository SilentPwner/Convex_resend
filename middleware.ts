// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authConfig } from "@/lib/auth/config";

export default async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: authConfig.secret });
  const url = new URL(req.url);
  
  // المسارات العامة
  const publicRoutes = ["/", "/login", "/register", "/api/auth", "/api/webhook"];
  const isPublicRoute = publicRoutes.some(route => 
    url.pathname.startsWith(route)
  );

  // المسارات المحمية
  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/moderator",
    "/profile",
    "/settings"
  ];
  
  // 1. التحقق من المستخدمين غير المسجلين
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  // 2. التحقق من صلاحيات الإدارة
  if (url.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // التحقق من دور المدير
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  
  // 3. التحقق من صلاحيات المشرفين
  if (url.pathname.startsWith("/moderator")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // التحقق من دور المشرف أو المدير
    if (session.role !== "moderator" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  
  // 4. التحقق من البريد الإلكتروني المؤكد
  const verifiedRoutes = ["/settings", "/donate", "/subscriptions"];
  if (verifiedRoutes.includes(url.pathname)) {
    if (!session?.emailVerified) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
  }
  
  // 5. منع المستخدمين المسجلين من الوصول لصفحات التسجيل
  if (session && (url.pathname === "/login" || url.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
    "/moderator/:path*",
    "/settings",
    "/donate",
    "/subscriptions",
    "/login",
    "/register"
  ],
};