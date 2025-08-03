import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authConfig } from "@/lib/auth/config";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export default async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: authConfig.secret });
  const url = new URL(req.url);
  
  // ===== القوائم المحدثة =====
  const PUBLIC_ROUTES = ["/", "/login", "/register", "/api/auth", "/api/webhook", "/unauthorized"];
  const PROTECTED_ROUTES = ["/dashboard", "/admin", "/moderator", "/profile", "/settings"];
  const VERIFIED_ROUTES = ["/settings", "/donate", "/subscriptions"];
  const AUTH_ROUTES = ["/login", "/register"];

  // ===== التحقق من المسارات العامة =====
  if (PUBLIC_ROUTES.some(route => url.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ===== التحقق من المستخدمين غير المسجلين =====
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ===== التحقق من الأدوار (محدث) =====
  const checkUserRole = async () => {
    if (!session?.email) return false;
    
    const user = await fetchQuery(api.users.getByEmail, { 
      email: session.email 
    });
    
    return user?.role || 'user';
  };

  const userRole = await checkUserRole();

  // ===== تحقق الأدمن الجديد =====
  if (url.pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ===== تحقق المشرفين =====
  if (url.pathname.startsWith("/moderator")) {
    if (!["moderator", "admin"].includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ===== التحقق من البريد المؤكد =====
  if (VERIFIED_ROUTES.includes(url.pathname)) {
    const user = await fetchQuery(api.users.getByEmail, { 
      email: session.email 
    });
    
    if (!user?.emailVerified) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
  }

  // ===== منع المسجلين من صفحات التسجيل =====
  if (AUTH_ROUTES.includes(url.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|_next/data).*)",
    "/admin/:path*",
    "/moderator/:path*",
    "/settings",
    "/donate",
    "/subscriptions",
    "/verify-email",
    "/unauthorized"
  ],
};