import { query } from './_generated/server';
import { v } from 'convex/values';

export const getDashboardStats = query({
  handler: async (ctx) => {
    // التحقق من دور المشرف
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.role !== 'admin') {
      throw new Error('غير مصرح بالوصول');
    }
    
    // جلب البيانات من قاعدة البيانات
    const users = await ctx.db.query('users').collect();
    const donations = await ctx.db.query('donations').collect();
    
    // إحصائيات وهمية لأغراض التوضيح
    return {
      totalUsers: users.length,
      userGrowth: 12.5,
      totalDonations: donations.reduce((sum, d) => sum + d.amount, 0),
      donationGrowth: 8.3,
      activeTransactions: 24,
      transactionGrowth: 5.2,
      conversionRate: 4.7,
      conversionChange: 1.8,
    };
  },
});