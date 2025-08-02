// في convex/schema.ts
syncLogs: defineTable({
  userId: v.string(),
  changes: v.number(),
  successful: v.number(),
  failed: v.number(),
  timestamp: v.number(),
}).index("by_user", ["userId"]),

pendingSyncChanges: defineTable({
  userId: v.string(),
  table: v.string(),
  operation: v.union(
    v.literal("create"),
    v.literal("update"),
    v.literal("delete")
  ),
  data: v.any(),
  localTimestamp: v.number(),
  deviceId: v.string(),
}).index("by_user", ["userId"]),