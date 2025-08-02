// convex/queries/dashboard.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// أنواع الفلاتر الزمنية
const timeFilter = v.union(
  v.literal("24h"),
  v.literal("7d"),
  v.literal("30d"),
  v.literal("all")
);

export const getDashboardStats = internalQuery({
  args: {
    userId: v.optional(v.string()),
    timeRange: timeFilter,
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      let cutoff = 0;

      switch (args.timeRange) {
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

      // إحصائيات المستخدمين
      const usersQuery = ctx.db.query("users");
      if (cutoff > 0) {
        usersQuery.filter((q) => q.gte(q.field("lastActive"), cutoff));
      }
      const totalUsers = await usersQuery.count();

      // إحصائيات التبرعات
      const donations = await ctx.db
        .query("donations")
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .collect();

      const donationStats = {
        total: donations.length,
        completed: donations.filter((d) => d.status === "completed").length,
        pending: donations.filter((d) => d.status === "pending").length,
        totalAmount: donations
          .filter((d) => d.status === "completed")
          .reduce((sum, d) => sum + d.amount, 0),
        byMethod: {
          credit_card: donations.filter((d) => d.method === "credit_card").length,
          bitcoin: donations.filter((d) => d.method === "bitcoin").length,
          paypal: donations.filter((d) => d.method === "paypal").length,
        },
      };

      // إحصائيات الأخطاء
      const errorStats = await ctx.runQuery(internal.errorHandling.getErrorStats, {
        timeframe: args.timeRange,
      });

      // نشاط الذكاء الاصطناعي
      const aiActivities = await ctx.db
        .query("aiAnalyses")
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .collect();

      const aiStats = {
        total: aiActivities.length,
        completed: aiActivities.filter((a) => a.status === "completed").length,
        failed: aiActivities.filter((a) => a.status === "failed").length,
        byType: {
          analysis: aiActivities.filter((a) => a.type === "analysis").length,
          transcription: aiActivities.filter((a) => a.type === "transcription").length,
          translation: aiActivities.filter((a) => a.type === "translation").length,
        },
      };

      // المهام المجدولة
      const scheduledTasks = await ctx.db
        .query("scheduledTasks")
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .collect();

      const tasksStats = {
        total: scheduledTasks.length,
        completed: scheduledTasks.filter((t) => t.status === "completed").length,
        failed: scheduledTasks.filter((t) => t.status === "failed").length,
        pending: scheduledTasks.filter((t) => t.status === "pending").length,
      };

      // بيانات المستخدم المحدد إذا كان موجوداً
      let userStats = null;
      if (args.userId) {
        const user = await ctx.db.get(args.userId);
        if (user) {
          const userDonations = donations.filter((d) => d.userId === args.userId);
          const userActivities = aiActivities.filter((a) => a.userId === args.userId);

          userStats = {
            name: user.name,
            email: user.email,
            lastActive: user.lastActive,
            donations: {
              total: userDonations.length,
              totalAmount: userDonations
                .filter((d) => d.status === "completed")
                .reduce((sum, d) => sum + d.amount, 0),
            },
            aiActivities: userActivities.length,
            lastDonation: userDonations[0]?.createdAt || null,
          };
        }
      }

      return {
        overview: {
          users: totalUsers,
          donations: donationStats.total,
          revenue: donationStats.totalAmount,
          aiProcesses: aiStats.total,
          errors: errorStats.total,
        },
        details: {
          donations: donationStats,
          errors: errorStats,
          ai: aiStats,
          tasks: tasksStats,
        },
        user: userStats,
        timeframe: args.timeRange,
        generatedAt: now,
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "dashboard",
          action: "getDashboardStats",
          metadata: {
            userId: args.userId,
            timeRange: args.timeRange,
          },
        },
      });
      throw error;
    }
  },
});

export const getRecentActivities = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const donations = await ctx.db
        .query("donations")
        .order("desc")
        .take(args.limit);

      const aiActivities = await ctx.db
        .query("aiAnalyses")
        .order("desc")
        .take(args.limit);

      const errors = await ctx.db
        .query("errorLogs")
        .order("desc")
        .take(args.limit);

      return {
        donations: donations.map((d) => ({
          id: d._id,
          type: "donation",
          userId: d.userId,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          createdAt: d.createdAt,
        })),
        aiActivities: aiActivities.map((a) => ({
          id: a._id,
          type: "ai_activity",
          userId: a.userId,
          activityType: a.type,
          status: a.status,
          createdAt: a.createdAt,
        })),
        errors: errors.map((e) => ({
          id: e._id,
          type: "error",
          module: e.module,
          severity: e.severity,
          error: e.error,
          timestamp: e.timestamp,
        })),
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "dashboard",
          action: "getRecentActivities",
          metadata: {
            limit: args.limit,
          },
        },
      });
      throw error;
    }
  },
});

export const getUserDashboard = internalQuery({
  args: {
    userId: v.string(),
    timeRange: timeFilter,
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      let cutoff = 0;

      switch (args.timeRange) {
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

      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // تبرعات المستخدم
      const donations = await ctx.db
        .query("donations")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .order("desc")
        .collect();

      // نشاط الذكاء الاصطناعي
      const aiActivities = await ctx.db
        .query("aiAnalyses")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.gte(q.field("createdAt"), cutoff))
        .order("desc")
        .collect();

      // الأخطاء المتعلقة بالمستخدم
      const userErrors = await ctx.db
        .query("errorLogs")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.gte(q.field("timestamp"), cutoff))
        .order("desc")
        .collect();

      return {
        user: {
          name: user.name,
          email: user.email,
          lastActive: user.lastActive,
          joinDate: user._creationTime,
        },
        donations: {
          total: donations.length,
          totalAmount: donations
            .filter((d) => d.status === "completed")
            .reduce((sum, d) => sum + d.amount, 0),
          recent: donations.slice(0, 5),
        },
        aiActivities: {
          total: aiActivities.length,
          completed: aiActivities.filter((a) => a.status === "completed").length,
          recent: aiActivities.slice(0, 5),
        },
        errors: {
          total: userErrors.length,
          critical: userErrors.filter((e) => e.severity === "critical").length,
          recent: userErrors.slice(0, 5),
        },
        generatedAt: now,
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "dashboard",
          action: "getUserDashboard",
          metadata: {
            userId: args.userId,
            timeRange: args.timeRange,
          },
        },
      });
      throw error;
    }
  },
});

export const dashboardQueries = {
  getDashboardStats,
  getRecentActivities,
  getUserDashboard,
};