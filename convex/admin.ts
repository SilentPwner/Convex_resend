import { query, mutation } from './_generated/server';

export const getAdminMetrics = query({
  handler: async (ctx) => {
    return await ctx.db.query('adminMetrics')
      .order('desc')
      .first();
  }
});

export const updateAdminMetrics = mutation({
  handler: async (ctx) => {
    const emailStats = await ctx.db.query('emails')
      .collect()
      .then(emails => ({
        total: emails.length,
        positive: emails.filter(e => e.tone === 'positive').length,
        negative: emails.filter(e => e.tone === 'negative').length
      }));

    const donationStats = await ctx.db.query('donations')
      .collect()
      .then(donations => ({
        total: donations.length,
        bitcoin: donations.filter(d => d.currency === 'BTC').length
      }));

    await ctx.db.insert('adminMetrics', {
      lastUpdated: Date.now(),
      emailStats,
      donationStats
    });
  }
});