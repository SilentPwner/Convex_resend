// convex/queries/analysis.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByTimeframe = query({
  args: {
    userId: v.id("users"),
    timeframe: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sentimentAnalysis")
      .withIndex("by_user_timeframe", q => 
        q.eq("userId", args.userId)
         .eq("timeframe", args.timeframe)
      )
      .order("desc")
      .first();
  }
});

export const getRecentAnalyses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sentimentAnalysis")
      .withIndex("by_date")
      .order("desc")
      .take(100); // آخر 100 تحليل
  }
});