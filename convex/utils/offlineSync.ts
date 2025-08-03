// convex/utils/offlineSync.ts
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { ConvexError } from "convex/values";
import { encryptionUtils } from "./encryption";

// أنواع عمليات المزامنة
const syncOperations = v.union(
  v.literal("create"),
  v.literal("update"),
  v.literal("delete")
);

export const prepareOfflineData = internalQuery({
  args: {
    userId: v.string(),
    lastSyncTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // جلب البيانات المطلوبة للمزامنة
      const [userData, donations, products] = await Promise.all([
        // بيانات المستخدم
        ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), args.userId))
          .first(),

        // التبرعات المرتبطة بالمستخدم
        ctx.db
          .query("donations")
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .filter((q) => 
            args.lastSyncTime 
              ? q.gte(q.field("createdAt"), args.lastSyncTime)
              : q.neq(q.field("_id"), null)
          )
          .collect(),

        // المنتجات النشطة
        ctx.db
          .query("products")
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect(),
      ]);

      if (!userData) {
        throw new ConvexError("User not found");
      }

      // تحضير البيانات للمزامنة
      const syncData = {
        user: userData,
        donations,
        products,
        lastSyncTime: Date.now(),
      };

      // تشفير البيانات الحساسة قبل الإرسال
      const encryptedData = await encryptionUtils.encryptObject(
        syncData,
        process.env.OFFLINE_SYNC_SECRET!
      );

      return {
        data: encryptedData,
        dataHash: await encryptionUtils.createHash(JSON.stringify(syncData)),
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "offlineSync",
          action: "prepareOfflineData",
          metadata: {
            userId: args.userId,
          },
        },
      });
      throw error;
    }
  },
});

export const processOfflineChanges = internalMutation({
  args: {
    userId: v.string(),
    changes: v.array(
      v.object({
        table: v.string(),
        operation: syncOperations,
        data: v.any(),
        localTimestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      const results = [];
      const now = Date.now();

      for (const change of args.changes) {
        try {
          let result;

          switch (change.operation) {
            case "create":
              result = await ctx.db.insert(change.table, {
                ...change.data,
                userId: args.userId,
                offlineSynced: true,
                createdAt: now,
                updatedAt: now,
              });
              break;

            case "update":
              result = await ctx.db.patch(change.data._id, {
                ...change.data,
                offlineSynced: true,
                updatedAt: now,
              });
              break;

            case "delete":
              await ctx.db.delete(change.data._id);
              result = { deleted: true, id: change.data._id };
              break;
          }

          results.push({
            ...change,
            serverId: result?._id || change.data._id,
            status: "success",
          });
        } catch (error) {
          results.push({
            ...change,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // تسجيل نتائج المزامنة
      await ctx.db.insert("syncLogs", {
        userId: args.userId,
        changes: args.changes.length,
        successful: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "failed").length,
        timestamp: now,
      });

      return { results };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "offlineSync",
          action: "processOfflineChanges",
          metadata: {
            userId: args.userId,
            changesCount: args.changes.length,
          },
        },
      });
      throw error;
    }
  },
});

export const resolveSyncConflicts = internalMutation({
  args: {
    conflicts: v.array(
      v.object({
        localId: v.string(),
        serverId: v.string(),
        table: v.string(),
        resolution: v.union(
          v.literal("keep_local"),
          v.literal("keep_server"),
          v.literal("merge")
        ),
        mergedData: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      const results = [];

      for (const conflict of args.conflicts) {
        try {
          let result;

          switch (conflict.resolution) {
            case "keep_local":
              // حذف السجل من الخادم واستبداله بالمحلي
              await ctx.db.delete(conflict.serverId);
              result = await ctx.db.insert(conflict.table, {
                ...conflict.mergedData,
                offlineSynced: true,
                updatedAt: Date.now(),
              });
              break;

            case "keep_server":
              // تجاهل التغييرات المحلية (لا شيء لفعله)
              result = { id: conflict.serverId };
              break;

            case "merge":
              // تطبيق بيانات مدمجة
              result = await ctx.db.patch(conflict.serverId, {
                ...conflict.mergedData,
                offlineSynced: true,
                updatedAt: Date.now(),
              });
              break;
          }

          results.push({
            ...conflict,
            finalId: result?._id || conflict.serverId,
            status: "success",
          });
        } catch (error) {
          results.push({
            ...conflict,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return { results };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "offlineSync",
          action: "resolveSyncConflicts",
        },
      });
      throw error;
    }
  },
});

export const getSyncStatus = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const lastSync = await ctx.db
        .query("syncLogs")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .first();

      const pendingChanges = await ctx.db
        .query("pendingSyncChanges")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();

      return {
        lastSync: lastSync
          ? {
              timestamp: lastSync.timestamp,
              changes: lastSync.changes,
              successful: lastSync.successful,
              failed: lastSync.failed,
            }
          : null,
        pendingChanges: pendingChanges.length,
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "offlineSync",
          action: "getSyncStatus",
          metadata: {
            userId: args.userId,
          },
        },
      });
      throw error;
    }
  },
});

export const offlineSyncUtils = {
  prepareOfflineData,
  processOfflineChanges,
  resolveSyncConflicts,
  getSyncStatus,
};