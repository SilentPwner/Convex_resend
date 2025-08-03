// lib/auth/admin.ts
import { auth } from "@clerk/nextjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function hasPermission(requiredRole: "admin" | "moderator" | "user") {
  const { userId } = auth();
  if (!userId) return false;

  try {
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) return false;

    const roleHierarchy = { user: 0, moderator: 1, admin: 2 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;

  try {
    return await convex.query(api.users.getByClerkId, { clerkId: userId });
  } catch (error) {
    console.error("User fetch error:", error);
    return null;
  }
}