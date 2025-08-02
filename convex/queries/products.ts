// convex/queries/products.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("trackedProducts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});