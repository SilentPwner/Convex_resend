// convex/mutations/alerts.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logSentAlert = mutation({
  args: {
    productId: v.id("trackedProducts"),
    userId: v.id("users"),
    emailId: v.string(),
    discountPercentage: v.number(),
    currentPrice: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("priceAlerts", {
      productId: args.productId,
      userId: args.userId,
      emailId: args.emailId,
      discountPercentage: args.discountPercentage,
      price: args.currentPrice,
      status: "sent",
      sentAt: Date.now()
    });
  }
});