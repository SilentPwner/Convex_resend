// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // === الجداول الأساسية ===
  users: defineTable({
    // معلومات الأساسية
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    
    // الأمان والمصادقة
    encryptionKey: v.string(),
    twoFactorSecret: v.optional(v.string()),
    lastLogin: v.optional(v.number()),
    
    // التفضيلات
    language: v.union(v.literal("en"), v.literal("ar")),
    theme: v.union(v.literal("light"), v.literal("dark")),
    notificationPreferences: v.object({
      email: v.boolean(),
      whatsapp: v.boolean(),
      push: v.boolean()
    }),
    
    // التمويل
    prefersCrypto: v.boolean(),
    defaultCurrency: v.union(v.literal("USD"), v.literal("BTC")),
    
    // الحالة
    isActive: v.boolean(),
    lastActive: v.optional(v.number()),
    storageUsed: v.optional(v.number())
  })
  .index("by_email", ["email"])
  .index("by_lastActive", ["lastActive"]),

  // === إدارة المنتجات ===
  trackedProducts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    productUrl: v.string(),
    imageUrl: v.optional(v.string()),
    
    // تتبع السعر
    currentPrice: v.number(),
    originalPrice: v.number(),
    lowestPrice: v.optional(v.number()),
    highestPrice: v.optional(v.number()),
    
    // التحليل
    priceChange7d: v.optional(v.number()),
    priceChange30d: v.optional(v.number()),
    
    // الإشعارات
    notificationThreshold: v.optional(v.number()),
    lastNotifiedPrice: v.optional(v.number()),
    lastChecked: v.number(),
    
    // التصنيفات
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string()))
  })
  .index("by_user", ["userId"])
  .index("by_priceChange", ["priceChange7d"])
  .index("by_category", ["category"]),

  // === التبرعات والمشاريع ===
  donations: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    
    // المالية
    amount: v.number(),
    currency: v.union(v.literal("USD"), v.literal("BTC")),
    fee: v.optional(v.number()),
    
    // حالة المعاملة
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.string(),
    
    // التتبع
    txHash: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    
    // التحقق
    isVerified: v.boolean(),
    verifiedAt: v.optional(v.number())
  })
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_status", ["status"]),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    
    // التمويل
    targetAmount: v.number(),
    collectedAmount: v.number(),
    currency: v.string(),
    
    // التوثيق
    images: v.array(v.string()),
    documents: v.optional(v.array(v.string())),
    
    // التواريخ
    startDate: v.number(),
    endDate: v.optional(v.number()),
    
    // التصنيف
    category: v.string(),
    tags: v.array(v.string()),
    
    // الموقع
    location: v.optional(v.object({
      country: v.string(),
      city: v.string(),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    }))
  })
  .index("by_owner", ["ownerId"])
  .index("by_category", ["category"]),

  // === الصحة العقلية ===
  mentalHealthReports: defineTable({
    userId: v.id("users"),
    
    // التحليل
    toneScore: v.number(),
    positivityIndex: v.number(),
    stressLevel: v.number(),
    
    // النتائج
    summary: v.string(),
    keywords: v.array(v.string()),
    recommendations: v.array(v.string()),
    
    // الفترة
    startDate: v.number(),
    endDate: v.number(),
    
    // المراجع
    referenceEmails: v.array(v.id("emails"))
  })
  .index("by_user", ["userId"])
  .index("by_date", ["startDate"]),

  // === الإيميلات والاتصالات ===
  emails: defineTable({
    userId: v.id("users"),
    
    // المحتوى
    subject: v.string(),
    content: v.string(),
    templateId: v.optional(v.string()),
    
    // التحليل
    tone: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral"),
      v.literal("mixed")
    ),
    sentimentScore: v.optional(v.number()),
    
    // التتبع
    isOpened: v.boolean(),
    openedAt: v.optional(v.number()),
    clickCount: v.number(),
    
    // البيانات الفنية
    headers: v.optional(v.object({})),
    metadata: v.optional(v.object({}))
  })
  .index("by_user", ["userId"])
  .index("by_tone", ["tone"]),

  // === المدفوعات المشفرة ===
  cryptoTransactions: defineTable({
    userId: v.id("users"),
    
    // المعاملة
    cryptoType: v.union(v.literal("BTC"), v.literal("ETH")),
    address: v.string(),
    amount: v.number(),
    usdValue: v.number(),
    
    // الحالة
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed")
    ),
    confirmations: v.number(),
    
    // التوقيت
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
    
    // البيانات المرجعية
    relatedDonation: v.optional(v.id("donations"))
  })
  .index("by_user", ["userId"])
  .index("by_status", ["status"]),

  // === السجلات والمراقبة ===
  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    
    // الإجراء
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    
    // السياق
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.string(),
      city: v.string()
    })),
    
    // البيانات
    metadata: v.optional(v.object({})),
    
    // التوقيت
    timestamp: v.number()
  })
  .index("by_user", ["userId"])
  .index("by_action", ["action"])
  .index("by_timestamp", ["timestamp"]),

  // === المزامنة بدون إنترنت ===
  offlineOperations: defineTable({
    userId: v.id("users"),
    
    // العملية
    action: v.string(),
    data: v.object({}),
    
    // الحالة
    status: v.union(
      v.literal("pending"),
      v.literal("synced"),
      v.literal("failed")
    ),
    
    // المحاولات
    retryCount: v.number(),
    lastAttempt: v.optional(v.number()),
    
    // التواريخ
    createdAt: v.number(),
    syncedAt: v.optional(v.number())
  })
  .index("by_user_status", ["userId", "status"])
});