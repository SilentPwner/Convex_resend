// convex/actions/errorHandling.ts
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// مستويات خطورة الأخطاء
const errorSeverity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

// تصنيفات الأخطاء
const errorCategories = v.union(
  v.literal("authentication"),
  v.literal("database"),
  v.literal("validation"),
  v.literal("third_party"),
  v.literal("payment"),
  v.literal("scheduling"),
  v.literal("ai_processing"),
  v.literal("unknown")
);

/**
 * ============ الإجراءات الرئيسية ============
 */

export const logError = internalAction({
  args: {
    userId: v.optional(v.string()),
    module: v.string(),
    error: v.string(),
    stack: v.optional(v.string()),
    severity: v.optional(errorSeverity),
    category: v.optional(errorCategories),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // تسجيل الخطأ في قاعدة البيانات
    await ctx.runMutation(internal.errorHandling.createErrorLog, {
      userId: args.userId,
      module: args.module,
      error: args.error,
      stack: args.stack || "",
      severity: args.severity || determineSeverity(args.error),
      category: args.category || determineCategory(args.module),
      metadata: args.metadata || {},
    });

    // إرسال تنبيه للفريق إذا كان الخطأ حرجاً
    if ((args.severity || determineSeverity(args.error)) === "critical") {
      await ctx.runAction(internal.resend.alerts.sendErrorAlert, {
        error: args.error,
        module: args.module,
        userId: args.userId,
      });
    }
  },
});

export const handleError = internalAction({
  args: {
    error: v.any(),
    context: v.object({
      userId: v.optional(v.string()),
      module: v.string(),
      action: v.string(),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const error = args.error instanceof Error ? args.error : new Error(JSON.stringify(args.error));
    
    await ctx.runAction(internal.errorHandling.logError, {
      userId: args.context.userId,
      module: args.context.module,
      error: error.message,
      stack: error.stack,
      metadata: {
        ...args.context.metadata,
        action: args.context.action,
      },
    });

    // معالجة خاصة لأنواع معينة من الأخطاء
    if (error.message.includes("auth")) {
      await ctx.runAction(internal.auth.handleAuthError, {
        userId: args.context.userId,
        error: error.message,
      });
    }

    // يمكنك إضافة المزيد من المعالجات الخاصة هنا
  },
});

/**
 * ============ الطفرات الداخلية ============
 */

export const createErrorLog = internalMutation({
  args: {
    userId: v.optional(v.string()),
    module: v.string(),
    error: v.string(),
    stack: v.string(),
    severity: errorSeverity,
    category: errorCategories,
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("errorLogs", {
      ...args,
      timestamp: Date.now(),
      resolved: false,
    });
  },
});

export const markErrorAsResolved = internalMutation({
  args: {
    errorId: v.string(),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.errorId, {
      resolved: true,
      resolvedAt: Date.now(),
      resolution: args.resolution || "",
    });
  },
});

export const updateErrorSeverity = internalMutation({
  args: {
    errorId: v.string(),
    severity: errorSeverity,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.errorId, {
      severity: args.severity,
    });
  },
});

/**
 * ============ الاستعلامات الداخلية ============
 */

export const getUnresolvedErrors = internalQuery({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(errorSeverity),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("errorLogs")
      .filter((q) => q.eq(q.field("resolved"), false));

    if (args.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    }

    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    return await query.order("desc").take(args.limit || 50);
  },
});

export const getErrorStats = internalQuery({
  args: {
    timeframe: v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let cutoff = 0;

    switch (args.timeframe) {
      case "24h":
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "all":
        cutoff = 0;
        break;
    }

    const errors = await ctx.db
      .query("errorLogs")
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    const stats = {
      total: errors.length,
      bySeverity: {
        critical: errors.filter((e) => e.severity === "critical").length,
        high: errors.filter((e) => e.severity === "high").length,
        medium: errors.filter((e) => e.severity === "medium").length,
        low: errors.filter((e) => e.severity === "low").length,
      },
      byCategory: {
        authentication: errors.filter((e) => e.category === "authentication").length,
        database: errors.filter((e) => e.category === "database").length,
        validation: errors.filter((e) => e.category === "validation").length,
        third_party: errors.filter((e) => e.category === "third_party").length,
        payment: errors.filter((e) => e.category === "payment").length,
        scheduling: errors.filter((e) => e.category === "scheduling").length,
        ai_processing: errors.filter((e) => e.category === "ai_processing").length,
        unknown: errors.filter((e) => e.category === "unknown").length,
      },
      unresolved: errors.filter((e) => !e.resolved).length,
    };

    return stats;
  },
});

/**
 * ============ الدوال المساعدة ============
 */

function determineSeverity(error: string): typeof errorSeverity.type {
  if (/(auth|password|permission|access)/i.test(error)) return "high";
  if (/(database|connection|timeout)/i.test(error)) return "critical";
  if (/(validation|input|format)/i.test(error)) return "medium";
  return "low";
}

function determineCategory(module: string): typeof errorCategories.type {
  if (/auth/i.test(module)) return "authentication";
  if (/database|query|mutation/i.test(module)) return "database";
  if (/validation|schema/i.test(module)) return "validation";
  if (/payment|donation/i.test(module)) return "payment";
  if (/cron|schedul/i.test(module)) return "scheduling";
  if (/ai|audio|analysis/i.test(module)) return "ai_processing";
  if (/third|api|external/i.test(module)) return "third_party";
  return "unknown";
}

/**
 * ============ تصدير الواجهة ============
 */

export const errorActions = {
  logError,
  handleError,
};

export const errorMutations = {
  createErrorLog,
  markErrorAsResolved,
  updateErrorSeverity,
};

export const errorQueries = {
  getUnresolvedErrors,
  getErrorStats,
};