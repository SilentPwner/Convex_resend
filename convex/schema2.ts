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
    role: v.union(v.literal("user"), v.literal("admin")),
    preferences: v.optional(v.any()),
    lastActive: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_lastActive", ["lastActive"]),

  sessions: defineTable({
    userId: v.string(),
    sessionToken: v.string(),
    expires: v.number(),
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
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  emailQueue: defineTable({
    to: v.string(),
    subject: v.string(),
    template: v.string(),
    data: v.any(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    attempts: v.number(),
    lastAttempt: v.optional(v.number()),
    scheduledAt: v.number(),
  }).index("by_status", ["status"]),

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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // === نظام التقارير ===
  reports: defineTable({
    userId: v.string(),
    type: v.string(),
    data: v.any(),
    generatedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

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
      v.literal("failed")
    ),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    interval: v.optional(v.string()),
    data: v.optional(v.any()),
  })
    .index("by_status", ["status"])
    .index("by_nextRun", ["nextRun"]),

  // === سجل الأخطاء ===
  errorLogs: defineTable({
    userId: v.optional(v.string()),
    module: v.string(),
    error: v.string(),
    stack: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_module", ["module"]),
});