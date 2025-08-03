// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // === الجداول الأساسية ===
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("guest")),
    preferences: v.optional(v.any()),
    lastActive: v.number(),
    failedLoginAttempts: v.optional(v.number()), // تتبع محاولات تسجيل الدخول الفاشلة
  })
    .index("by_email", ["email"])
    .index("by_lastActive", ["lastActive"]),

  sessions: defineTable({
    userId: v.string(),
    sessionToken: v.string(),
    expires: v.number(),
    ipAddress: v.optional(v.string()), // لتتبع الأخطاء الأمنية
    userAgent: v.optional(v.string()),
  }).index("by_sessionToken", ["sessionToken"]),

  // === نظام الإشعارات والرسائل ===
  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("whatsapp"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    error: v.optional(v.string()), // في حالة فشل الإرسال
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // === نظام التبرعات ===
  donations: defineTable({
    userId: v.string(),
    amount: v.number(),
    currency: v.string(),
    method: v.union(
      v.literal("credit_card"),
      v.literal("bitcoin"),
      v.literal("paypal")
    ),
    transactionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    errorDetails: v.optional(v.string()), // تفاصيل الخطأ إذا فشلت العملية
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // === معالجة الصوت والذكاء الاصطناعي ===
  audioProcesses: defineTable({
    userId: v.string(),
    actionType: v.union(
      v.literal("transcribe"),
      v.literal("translate"),
      v.literal("analyze_sentiment"),
      v.literal("generate_speech")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    input: v.optional(v.string()),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()), // stack trace للأخطاء
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // === المدفوعات المشفرة ===
  cryptoTransactions: defineTable({
    userId: v.string(),
    currency: v.union(v.literal("bitcoin"), v.literal("ethereum")),
    amount: v.number(),
    address: v.string(),
    txHash: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
    errorCode: v.optional(v.string()), // كود الخطأ الخاص بالعملات المشفرة
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_currency", ["currency"]),

  // === المهام المجدولة ===
  scheduledTasks: defineTable({
    name: v.string(),
    type: v.string(),
    scheduledTime: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("paused")
    ),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    interval: v.optional(v.string()),
    data: v.optional(v.any()),
    lastError: v.optional(v.string()), // آخر خطأ واجهته المهمة
  })
    .index("by_status", ["status"])
    .index("by_nextRun", ["nextRun"]),

  // === سجل الأخطاء ===
  errorLogs: defineTable({
    userId: v.optional(v.string()),
    module: v.string(),
    error: v.string(),
    stack: v.string(),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    category: v.union(
      v.literal("authentication"),
      v.literal("database"),
      v.literal("validation"),
      v.literal("third_party"),
      v.literal("payment"),
      v.literal("scheduling"),
      v.literal("ai_processing"),
      v.literal("unknown")
    ),
    metadata: v.any(),
    timestamp: v.number(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  })
    .index("by_module", ["module"])
    .index("by_severity", ["severity"])
    .index("by_timestamp", ["timestamp"])
    .index("by_resolved", ["resolved"]),

  // === التقارير ===
  reports: defineTable({
    userId: v.string(),
    type: v.string(),
    data: v.any(),
    generatedAt: v.number(),
    expiresAt: v.optional(v.number()),
    generationError: v.optional(v.string()), // خطأ في توليد التقرير
  }).index("by_user", ["userId"]),

  // === تحليلات الذكاء الاصطناعي ===
  aiAnalyses: defineTable({
    userId: v.string(),
    type: v.string(),
    input: v.any(),
    output: v.optional(v.any()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});