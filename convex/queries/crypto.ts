// convex/queries/crypto.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getInvoice = query({
  args: { id: v.id("cryptoInvoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getUserAddresses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bitcoinAddresses")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
  }
});