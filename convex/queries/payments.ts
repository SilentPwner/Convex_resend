// convex/queries/payments.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("cryptoPayments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getUserPayments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cryptoPayments")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  }
});