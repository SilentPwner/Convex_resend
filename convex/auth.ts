// convex/auth.ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error('البريد الإلكتروني غير صالح');
    }

    // التحقق من قوة كلمة المرور
    if (args.password.length < 8) {
      throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    // التحقق من وجود المستخدم
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .unique();

    if (existingUser) {
      throw new Error('البريد الإلكتروني مسجل بالفعل');
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(args.password, salt);

    // إنشاء رمز التحقق
    const verificationToken = crypto.randomUUID();

    // إنشاء المستخدم الجديد
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      verificationToken,
      createdAt: Date.now(),
    });

    // إرسال بريد التحقق
    await ctx.scheduler.runAfter(0, 'resend:alerts/sendVerificationEmail', {
      email: args.email,
      token: verificationToken,
      name: args.name,
    });

    return { success: true, userId };
  },
});

export const verifyEmail = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('verificationToken'), args.token))
      .unique();

    if (!user) {
      throw new Error('رابط التحقق غير صالح أو منتهي الصلاحية');
    }

    await ctx.db.patch(user._id, {
      emailVerified: true,
      verificationToken: undefined,
      verifiedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .unique();
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .unique();

    if (!user) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    if (!user.emailVerified) {
      throw new Error('الرجاء التحقق من بريدك الإلكتروني أولاً');
    }

    const isValid = await bcrypt.compare(args.password, user.password);
    if (!isValid) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // تحديث آخر وقت دخول
    await ctx.db.patch(user._id, {
      lastLogin: Date.now(),
    });

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});