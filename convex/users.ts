// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

// جلب المستخدم بواسطة Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), clerkId))
      .unique();
  },
});

// جلب المستخدم بواسطة البريد الإلكتروني
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .unique();
  },
});

// إنشاء أو تحديث المستخدم (يدعم Clerk والمستخدمين المحليين)
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    password: v.optional(v.string()), // كلمة المرور المشفرة
    emailVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // البحث عن المستخدم بواسطة Clerk ID أو البريد الإلكتروني
    let existing = null;
    
    if (args.clerkId) {
      existing = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkUserId"), args.clerkId))
        .unique();
    }
    
    if (!existing && args.email) {
      existing = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .unique();
    }

    // تحضير بيانات المستخدم
    const userData = {
      clerkUserId: args.clerkId || existing?.clerkUserId || null,
      email: args.email,
      name: args.name || existing?.name || null,
      imageUrl: args.imageUrl || existing?.imageUrl || null,
      lastLogin: Date.now(),
      password: args.password || existing?.password || null,
      emailVerified: args.emailVerified !== undefined 
        ? args.emailVerified 
        : existing?.emailVerified || false,
    };

    // التحديث أو الإنشاء
    if (existing) {
      return await ctx.db.patch(existing._id, userData);
    } else {
      return await ctx.db.insert("users", {
        ...userData,
        role: "user",
        createdAt: Date.now(),
      });
    }
  },
});

// تحديث دور المستخدم
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(v.literal("user"), v.literal("admin"), v.literal("moderator")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email!))
      .unique();

    if (currentUser?.role !== "admin") {
      throw new Error("Only admins can update roles");
    }

    await ctx.db.patch(args.userId, { role: args.newRole });
    return { success: true };
  },
});

// تحديث وقت آخر دخول
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastLogin: Date.now() });
  },
});

// تحديث بيانات مزود الحساب
export const updateProviderAccount = mutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      [`${args.provider}AccountId`]: args.providerAccountId,
    });
  },
});

// تسجيل مستخدم جديد (للمصادقة المحلية)
export const registerLocalUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // التحقق من عدم وجود مستخدم بنفس البريد
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
    
    if (existing) {
      throw new Error("User already exists with this email");
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(args.password, 10);
    
    // إنشاء المستخدم
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      password: hashedPassword,
      role: "user",
      emailVerified: false,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    });
  },
});

// التحقق من بيانات تسجيل الدخول
export const verifyLoginCredentials = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
    
    if (!user) return null;
    if (!user.password) return null;
    
    const isValid = await bcrypt.compare(args.password, user.password);
    return isValid ? user : null;
  },
});

// تحديث كلمة المرور
export const updatePassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const hashedPassword = await bcrypt.hash(args.newPassword, 10);
    await ctx.db.patch(args.userId, { password: hashedPassword });
    return { success: true };
  },
});

// تحديث حالة التحقق من البريد الإلكتروني
export const verifyEmail = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { emailVerified: true });
    return { success: true };
  },
});

// جلب جميع المستخدمين (للإدارة)
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});