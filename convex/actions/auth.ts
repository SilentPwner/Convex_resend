// convex/actions/auth.ts
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { encryptionUtils } from "../utils/encryption";

// أنواع المستخدمين والأدوار
const userRoles = v.union(v.literal("user"), v.literal("admin"), v.literal("guest"));
const authProviders = v.union(v.literal("email"), v.literal("google"), v.literal("github"));

/**
 * ============ إجراءات المصادقة الرئيسية ============
 */

export const registerUser = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    provider: authProviders,
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // التحقق من عدم وجود مستخدم بنفس البريد
      const existingUser = await ctx.runQuery(internal.auth.getUserByEmail, {
        email: args.email,
      });

      if (existingUser) {
        throw new ConvexError("User already exists");
      }

      // تشفير كلمة المرور
      const hashedPassword = await encryptionUtils.hashPassword(args.password);

      // إنشاء المستخدم
      const userId = await ctx.runMutation(internal.auth.createUser, {
        email: args.email,
        password: hashedPassword,
        name: args.name,
        provider: args.provider,
        image: args.image,
        role: "user",
      });

      // إنشاء جلسة
      const sessionToken = generateSessionToken();
      await ctx.runMutation(internal.auth.createSession, {
        userId,
        sessionToken: await encryptionUtils.encryptData(sessionToken, process.env.SESSION_SECRET!),
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 يوم
      });

      // إرسال بريد التحقق إذا كان التسجيل بالبريد
      if (args.provider === "email") {
        await ctx.runAction(internal.resend.alerts.sendVerificationEmail, {
          email: args.email,
          userId,
        });
      }

      return { 
        userId, 
        sessionToken, 
        encryptedSession: await encryptionUtils.encryptData(
          JSON.stringify({ userId, token: sessionToken }),
          process.env.SESSION_SECRET!
        ) 
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "auth",
          action: "register",
          metadata: {
            email: args.email,
            provider: args.provider,
          },
        },
      });
      throw error;
    }
  },
});

export const loginUser = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // جلب المستخدم من قاعدة البيانات
      const user = await ctx.runQuery(internal.auth.getUserByEmail, {
        email: args.email,
      });

      if (!user) {
        throw new ConvexError("Invalid credentials");
      }

      // التحقق من كلمة المرور
      const isValid = await encryptionUtils.verifyPassword(
        args.password,
        user.password
      );

      if (!isValid) {
        // زيادة عدد محاولات الدخول الفاشلة
        await ctx.runMutation(internal.auth.incrementFailedAttempts, {
          userId: user._id,
        });
        throw new ConvexError("Invalid credentials");
      }

      // إعادة تعيين محاولات الدخول الفاشلة
      await ctx.runMutation(internal.auth.resetFailedAttempts, {
        userId: user._id,
      });

      // إنشاء جلسة جديدة
      const sessionToken = generateSessionToken();
      const expires = args.rememberMe
        ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 يوم
        : Date.now() + 24 * 60 * 60 * 1000; // 1 يوم

      await ctx.runMutation(internal.auth.createSession, {
        userId: user._id,
        sessionToken: await encryptionUtils.encryptData(sessionToken, process.env.SESSION_SECRET!),
        expires,
      });

      // تحديث آخر نشاط للمستخدم
      await ctx.runMutation(internal.auth.updateUserLastActive, {
        userId: user._id,
      });

      return { 
        userId: user._id, 
        sessionToken,
        encryptedSession: await encryptionUtils.encryptData(
          JSON.stringify({ userId: user._id, token: sessionToken }),
          process.env.SESSION_SECRET!
        ),
        role: user.role 
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "auth",
          action: "login",
          metadata: {
            email: args.email,
          },
        },
      });
      throw error;
    }
  },
});

export const logoutUser = internalAction({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // فك تشفير الجلسة
      const decryptedToken = await encryptionUtils.decryptData(
        args.sessionToken,
        process.env.SESSION_SECRET!
      );

      // حذف الجلسة
      await ctx.runMutation(internal.auth.deleteSession, {
        sessionToken: decryptedToken,
      });

      return { success: true };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "auth",
          action: "logout",
        },
      });
      throw error;
    }
  },
});

export const verifyEmail = internalAction({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // فك تشفير الرمز
      const decryptedToken = await encryptionUtils.decryptData(
        args.token,
        process.env.VERIFICATION_SECRET!
      );
      const payload = JSON.parse(decryptedToken);

      if (!payload?.userId) {
        throw new ConvexError("Invalid token");
      }

      // تحديث حالة المستخدم
      await ctx.runMutation(internal.auth.markEmailAsVerified, {
        userId: payload.userId,
      });

      return { success: true };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "auth",
          action: "verifyEmail",
        },
      });
      throw error;
    }
  },
});

/**
 * ============ الطفرات الداخلية ============
 */

export const createUser = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    provider: authProviders,
    image: v.optional(v.string()),
    role: userRoles,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      emailVerified: args.provider !== "email",
      lastActive: Date.now(),
      failedLoginAttempts: 0,
    });
  },
});

export const createSession = internalMutation({
  args: {
    userId: v.string(),
    sessionToken: v.string(), // مشفر
    expires: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      sessionToken: args.sessionToken,
      expires: args.expires,
      createdAt: Date.now(),
    });
  },
});

export const deleteSession = internalMutation({
  args: {
    sessionToken: v.string(), // غير مشفر
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

export const updateUserLastActive = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastActive: Date.now() });
  },
});

export const markEmailAsVerified = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { emailVerified: true });
  },
});

export const incrementFailedAttempts = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      await ctx.db.patch(user._id, { 
        failedLoginAttempts: attempts,
        ...(attempts >= 5 ? { status: "locked" } : {}), // قفل الحساب بعد 5 محاولات
      });
    }
  },
});

export const resetFailedAttempts = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { failedLoginAttempts: 0 });
  },
});

/**
 * ============ الاستعلامات الداخلية ============
 */

export const getUser = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const validateSession = internalQuery({
  args: {
    encryptedToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // فك تشفير الجلسة
      const decrypted = await encryptionUtils.decryptData(
        args.encryptedToken,
        process.env.SESSION_SECRET!
      );
      const sessionData = JSON.parse(decrypted);

      const session = await ctx.db
        .query("sessions")
        .withIndex("by_sessionToken", (q) =>
          q.eq("sessionToken", sessionData.token)
        )
        .first();

      if (!session || session.expires < Date.now()) {
        return null;
      }

      const user = await ctx.db.get(session.userId);
      if (!user) {
        return null;
      }

      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "auth",
          action: "validateSession",
        },
      });
      return null;
    }
  },
});

/**
 * ============ الدوال المساعدة ============
 */

function generateSessionToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * ============ تصدير الواجهة ============
 */

export const authActions = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  verifyEmail: verifyEmail,
};

export const authMutations = {
  createUser,
  createSession,
  deleteSession,
  updateUserLastActive,
  markEmailAsVerified,
  incrementFailedAttempts,
  resetFailedAttempts,
};

export const authQueries = {
  getUser,
  getUserByEmail,
  validateSession,
};