// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // === نظام المستخدمين ===
  users: defineTable({
    // المعلومات الأساسية
    name: v.optional(v.string()),
    email: v.string(),
    clerkUserId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),

    // الأمان والمصادقة
    password: v.optional(v.string()),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("guest")
    ),
    emailVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    verificationEmailSent: v.optional(v.boolean()),
    verificationEmailId: v.optional(v.string()),
    twoFactorSecret: v.optional(v.string()),
    encryptionKey: v.optional(v.string()),
    failedLoginAttempts: v.optional(v.number()),

    // التفضيلات
    language: v.union(v.literal("en"), v.literal("ar")),
    theme: v.union(v.literal("light"), v.literal("dark")),
    notificationPreferences: v.optional(
      v.object({
        email: v.boolean(),
        whatsapp: v.boolean(),
        push: v.boolean(),
        system: v.boolean()
      })
    ),
    prefersCrypto: v.optional(v.boolean()),
    defaultCurrency: v.optional(v.union(v.literal("USD"), v.literal("BTC")),

    // التواريخ والحالة
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
    lastLogin: v.optional(v.number()),
    lastActive: v.optional(v.number()),
    isActive: v.boolean(),
    storageUsed: v.optional(v.number())
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_lastActive", ["lastActive"]),

  // === نظام الجلسات ===
  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expires: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_sessionToken", ["sessionToken"]),

  // === نظام المنتجات ===
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.union(
      v.literal("donation"),
      v.literal("subscription"),
      v.literal("digital"),
      v.literal("physical"),
      v.literal("service")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("archived"),
      v.literal("out_of_stock")
    ),
    images: v.array(v.string()),
    tags: v.array(v.string()),
    inventory: v.optional(v.number()),
    isFeatured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_featured", ["isFeatured"])
    .index("by_created", ["createdAt"]),

  // === نظام التبرعات والمشاريع ===
  donations: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    productId: v.optional(v.id("products")),
    amount: v.number(),
    currency: v.union(v.literal("USD"), v.literal("BTC")),
    fee: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.union(
      v.literal("credit_card"),
      v.literal("bitcoin"),
      v.literal("ethereum"),
      v.literal("paypal")
    ),
    txHash: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    isVerified: v.boolean(),
    verifiedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    errorDetails: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    targetAmount: v.number(),
    collectedAmount: v.number(),
    currency: v.string(),
    images: v.array(v.string()),
    documents: v.optional(v.array(v.string())),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    category: v.string(),
    tags: v.array(v.string()),
    location: v.optional(
      v.object({
        country: v.string(),
        city: v.string(),
        coordinates: v.optional(
          v.object({
            lat: v.number(),
            lng: v.number()
          })
        )
      })
    )
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"]),

  // === نظام الإشعارات ===
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("email"),
      v.literal("whatsapp"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // === تتبع المنتجات ===
  trackedProducts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    productUrl: v.string(),
    imageUrl: v.optional(v.string()),
    currentPrice: v.number(),
    originalPrice: v.number(),
    lowestPrice: v.optional(v.number()),
    highestPrice: v.optional(v.number()),
    priceChange7d: v.optional(v.number()),
    priceChange30d: v.optional(v.number()),
    notificationThreshold: v.optional(v.number()),
    lastNotifiedPrice: v.optional(v.number()),
    lastChecked: v.number(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string()))
  })
    .index("by_user", ["userId"])
    .index("by_priceChange", ["priceChange7d"])
    .index("by_category", ["category"]),

  // === معالجة الذكاء الاصطناعي ===
  audioProcesses: defineTable({
    userId: v.id("users"),
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
    errorStack: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  aiAnalyses: defineTable({
    userId: v.id("users"),
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

  // === إدارة الإيميلات ===
  emails: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    content: v.string(),
    templateId: v.optional(v.string()),
    tone: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral"),
      v.literal("mixed")
    ),
    sentimentScore: v.optional(v.number()),
    isOpened: v.boolean(),
    openedAt: v.optional(v.number()),
    clickCount: v.number(),
    headers: v.optional(v.object({})),
    metadata: v.optional(v.object({}))
  })
    .index("by_user", ["userId"])
    .index("by_tone", ["tone"]),

  // === الصحة العقلية ===
  mentalHealthReports: defineTable({
    userId: v.id("users"),
    toneScore: v.number(),
    positivityIndex: v.number(),
    stressLevel: v.number(),
    summary: v.string(),
    keywords: v.array(v.string()),
    recommendations: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    referenceEmails: v.array(v.id("emails"))
  })
    .index("by_user", ["userId"])
    .index("by_date", ["startDate"]),

  // === المعاملات المشفرة ===
  cryptoTransactions: defineTable({
    userId: v.id("users"),
    cryptoType: v.union(v.literal("BTC"), v.literal("ETH")),
    address: v.string(),
    amount: v.number(),
    usdValue: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed")
    ),
    confirmations: v.number(),
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
    relatedDonation: v.optional(v.id("donations")),
    errorCode: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_currency", ["cryptoType"]),

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
    lastError: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_nextRun", ["nextRun"]),

  // === سجلات التدقيق والأخطاء ===
  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(
      v.object({
        country: v.string(),
        city: v.string()
      })
    ),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  errorLogs: defineTable({
    userId: v.optional(v.id("users")),
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
    userId: v.id("users"),
    type: v.string(),
    data: v.any(),
    generatedAt: v.number(),
    expiresAt: v.optional(v.number()),
    generationError: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // === العمليات دون اتصال ===
  offlineOperations: defineTable({
    userId: v.id("users"),
    action: v.string(),
    data: v.object({}),
    status: v.union(
      v.literal("pending"),
      v.literal("synced"),
      v.literal("failed")
    ),
    retryCount: v.number(),
    lastAttempt: v.optional(v.number()),
    createdAt: v.number(),
    syncedAt: v.optional(v.number())
  })
    .index("by_user_status", ["userId", "status"])
});