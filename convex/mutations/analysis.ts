// convex/mutations/analysis.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveResults = mutation({
  args: {
    userId: v.id("users"),
    timeframe: v.string(),
    individualAnalysis: v.any(),
    overallAnalysis: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sentimentAnalysis", {
      userId: args.userId,
      timeframe: args.timeframe,
      individualResults: args.individualAnalysis,
      overallResults: args.overallAnalysis,
      date: Date.now()
    });
  }
});

export const saveMentalHealthReport = mutation({
  args: {
    userId: v.id("users"),
    analysis: v.any(),
    summary: v.string(),
    healthScore: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("mentalHealthReports", {
      userId: args.userId,
      analysis: args.analysis,
      summary: args.summary,
      healthScore: args.healthScore,
      generatedAt: Date.now()
    });
  }
});