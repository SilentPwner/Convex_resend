export const updateLastLogin = mutation({
  args: {
    userId: v.string(),
    lastLogin: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastLogin: args.lastLogin,
    });
  },
});