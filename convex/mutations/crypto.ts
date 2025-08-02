// convex/mutations/crypto.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const storeAddress = mutation({
  args: {
    userId: v.id("users"),
    address: v.string(),
    encryptedWIF: v.string(),
    network: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bitcoinAddresses", {
      userId: args.userId,
      address: args.address,
      encryptedWIF: args.encryptedWIF,
      network: args.network,
      createdAt: Date.now()
    });
  }
});

export const createInvoiceRecord = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    amountUSD: v.number(),
    amountBTC: v.number(),
    address: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("expired")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cryptoInvoices", {
      ...args,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 دقيقة
    });
  }
});

export const updateInvoiceStatus = mutation({
  args: {
    invoiceId: v.id("cryptoInvoices"),
    status: v.string(),
    txHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invoiceId, {
      status: args.status,
      txHash: args.txHash,
      paidAt: args.status === "paid" ? Date.now() : undefined
    });
  }
});