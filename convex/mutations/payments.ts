// convex/mutations/payments.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createRecord = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    cryptoType: v.string(),
    cryptoAmount: v.number(),
    address: v.string(),
    status: v.string(),
    projectId: v.optional(v.id("projects")),
    expiresAt: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cryptoPayments", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const updateStatus = mutation({
  args: {
    paymentId: v.id("cryptoPayments"),
    status: v.string(),
    txHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      status: args.status,
      txHash: args.txHash,
      updatedAt: Date.now(),
      completedAt: args.status === "completed" ? Date.now() : undefined
    });
  }
});