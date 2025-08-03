// convex/actions/crons.ts
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { ConvexError } from "convex/values";

// أنواع المهام المجدولة
const taskTypes = v.union(
  v.literal("email_reminder"),
  v.literal("data_cleanup"),
  v.literal("report_generation"),
  v.literal("donation_reminder"),
  v.literal("backup"),
  v.literal("custom_task") // أضفنا النوع المخصص هنا
);

// حالة المهام
const taskStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("paused")
);

/**
 * ============ الإجراءات الرئيسية ============
 */

export const scheduleTask = internalAction({
  args: {
    name: v.string(),
    type: taskTypes,
    scheduledTime: v.number(), // timestamp
    interval: v.optional(v.string()), // مثال: "1d", "2h", "30m"
    data: v.optional(v.any()), // بيانات إضافية للمهمة
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.runMutation(internal.crons.createTask, {
      name: args.name,
      type: args.type,
      scheduledTime: args.scheduledTime,
      interval: args.interval,
      status: "pending",
      data: args.data,
    });

    return { taskId };
  },
});

export const runScheduledTasks = internalAction({
  args: {
    batchSize: v.optional(v.number()), // عدد المهام التي تعمل في نفس الوقت
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tasks = await ctx.runQuery(internal.crons.getPendingTasks, {
      limit: args.batchSize || 10,
      currentTime: now,
    });

    const results = [];
    for (const task of tasks) {
      try {
        // تحديث حالة المهمة إلى "جاري التنفيذ"
        await ctx.runMutation(internal.crons.updateTaskStatus, {
          taskId: task._id,
          status: "running",
          lastRun: now,
        });

        // تنفيذ المهمة حسب النوع
        let result;
        switch (task.type) {
          case "email_reminder":
            result = await handleEmailReminder(ctx, task);
            break;
          case "data_cleanup":
            result = await handleDataCleanup(ctx, task);
            break;
          case "report_generation":
            result = await handleReportGeneration(ctx, task);
            break;
          case "donation_reminder":
            result = await handleDonationReminder(ctx, task);
            break;
          case "backup":
            result = await handleBackup(ctx, task);
            break;
          case "custom_task":
            result = await handleCustomTask(ctx, task);
            break;
          default:
            throw new ConvexError(`Unknown task type: ${task.type}`);
        }

        // إذا كانت المهمة متكررة، جدول المرة القادمة
        if (task.interval) {
          const nextRun = calculateNextRun(task.scheduledTime, task.interval);
          await ctx.runMutation(internal.crons.rescheduleTask, {
            taskId: task._id,
            nextRun,
            lastRun: now,
          });
        } else {
          // إذا كانت لمرة واحدة، ضعها كمكتملة
          await ctx.runMutation(internal.crons.updateTaskStatus, {
            taskId: task._id,
            status: "completed",
            lastRun: now,
          });
        }

        results.push({ taskId: task._id, success: true, result });
      } catch (error) {
        await ctx.runMutation(internal.crons.logTaskError, {
          taskId: task._id,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
        results.push({ taskId: task._id, success: false, error });
      }
    }

    return { results };
  },
});

/**
 * ============ معالجات المهام ============
 */

async function handleEmailReminder(ctx: any, task: any) {
  await ctx.runAction(internal.resend.alerts.sendReminderEmail, {
    template: "reminder",
    userIds: task.data.userIds,
  });
  return { sent: true };
}

async function handleDataCleanup(ctx: any, task: any) {
  const cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 يوم
  const oldSessions = await ctx.runQuery(internal.crons.getOldSessions, {
    cutoffDate,
  });

  for (const session of oldSessions) {
    await ctx.runMutation(internal.crons.deleteSession, {
      sessionId: session._id,
    });
  }

  return { deletedCount: oldSessions.length };
}

async function handleReportGeneration(ctx: any, task: any) {
  const reportData = await ctx.runAction(internal.ai.analysis.generateReport, {
    type: task.data.reportType,
    dateRange: task.data.dateRange,
  });

  await ctx.runMutation(internal.crons.storeReport, {
    taskId: task._id,
    reportData,
  });

  return { reportGenerated: true };
}

async function handleDonationReminder(ctx: any, task: any) {
  const usersToRemind = await ctx.runQuery(internal.crons.getDonorsToRemind, {
    lastDonationBefore: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 يوم
  });

  for (const user of usersToRemind) {
    await ctx.runAction(internal.resend.donations.sendReminder, {
      userId: user._id,
    });
  }

  return { remindedCount: usersToRemind.length };
}

async function handleBackup(ctx: any, task: any) {
  const backupData = await ctx.runQuery(internal.crons.generateBackupData, {
    collections: task.data.collections,
  });

  await ctx.runAction(internal.resend.reports.sendBackupReport, {
    backupData,
    recipients: task.data.recipients,
  });

  return { backupCompleted: true };
}

async function handleCustomTask(ctx: any, task: any) {
  // هنا يمكنك تنفيذ أي منطق مخصص
  // مثال:
  // await ctx.runAction(internal.actions.customAction, task.data);
  
  return { 
    success: true,
    message: "تم تنفيذ المهمة المخصصة بنجاح",
    customData: task.data 
  };
}

/**
 * ============ الطفرات الداخلية ============
 */

export const createTask = internalMutation({
  args: {
    name: v.string(),
    type: taskTypes,
    scheduledTime: v.number(),
    interval: v.optional(v.string()),
    status: taskStatus,
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduledTasks", {
      ...args,
      nextRun: args.scheduledTime,
      createdAt: Date.now(),
    });
  },
});

export const updateTaskStatus = internalMutation({
  args: {
    taskId: v.string(),
    status: taskStatus,
    lastRun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: args.status,
      lastRun: args.lastRun,
    });
  },
});

export const rescheduleTask = internalMutation({
  args: {
    taskId: v.string(),
    nextRun: v.number(),
    lastRun: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "pending",
      nextRun: args.nextRun,
      lastRun: args.lastRun,
    });
  },
});

export const logTaskError = internalMutation({
  args: {
    taskId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "failed",
      lastError: args.error,
      lastRun: Date.now(),
    });
  },
});

export const deleteSession = internalMutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

export const storeReport = internalMutation({
  args: {
    taskId: v.string(),
    reportData: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reports", {
      taskId: args.taskId,
      data: args.reportData,
      generatedAt: Date.now(),
    });
  },
});

/**
 * ============ الاستعلامات الداخلية ============
 */

export const getPendingTasks = internalQuery({
  args: {
    limit: v.number(),
    currentTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledTasks")
      .withIndex("by_nextRun", (q) => q.lte("nextRun", args.currentTime))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(args.limit);
  },
});

export const getTasks = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("scheduledTasks")
      .order("desc")
      .collect();
  },
});

export const getOldSessions = internalQuery({
  args: {
    cutoffDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_expires", (q) => q.lte("expires", args.cutoffDate))
      .collect();
  },
});

export const getDonorsToRemind = internalQuery({
  args: {
    lastDonationBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_createdAt", (q) => q.lte("createdAt", args.lastDonationBefore))
      .collect();

    const userIds = [...new Set(donations.map((d) => d.userId))];
    return await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("role"), "admin"))
      .filter((q) => q.in(q.field("_id"), userIds))
      .collect();
  },
});

export const generateBackupData = internalQuery({
  args: {
    collections: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const backup: Record<string, any[]> = {};
    for (const collection of args.collections) {
      backup[collection] = await ctx.db.query(collection).collect();
    }
    return backup;
  },
});

/**
 * ============ الدوال المساعدة ============
 */

function calculateNextRun(lastRun: number, interval: string): number {
  const value = parseInt(interval.slice(0, -1));
  const unit = interval.slice(-1);

  let milliseconds = 0;
  switch (unit) {
    case "s": // ثواني
      milliseconds = value * 1000;
      break;
    case "m": // دقائق
      milliseconds = value * 60 * 1000;
      break;
    case "h": // ساعات
      milliseconds = value * 60 * 60 * 1000;
      break;
    case "d": // أيام
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    case "w": // أسابيع
      milliseconds = value * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new ConvexError(`Invalid interval unit: ${unit}`);
  }

  return lastRun + milliseconds;
}

/**
 * ============ تصدير الواجهة ============
 */

export const cronActions = {
  scheduleTask,
  runScheduledTasks,
};

export const cronMutations = {
  createTask,
  updateTaskStatus,
  rescheduleTask,
  logTaskError,
  deleteSession,
  storeReport,
};

export const cronQueries = {
  getPendingTasks,
  getTasks,
  getOldSessions,
  getDonorsToRemind,
  generateBackupData,
};