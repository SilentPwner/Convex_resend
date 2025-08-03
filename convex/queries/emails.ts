// في ملف convex/queries/emails.ts
export const getEmailStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('emails')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .collect()
      .then(emails => ({
        sent: emails.length,
        delivered: emails.filter(e => e.status === 'delivered').length,
        opened: emails.filter(e => e.opens > 0).length,
        bounceRate: emails.filter(e => e.status === 'bounced').length / emails.length
      }));
  }
});