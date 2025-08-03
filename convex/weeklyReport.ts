import { cronJob } from 'convex/server';
import { internal } from './_generated/api';

export default cronJob({
  name: 'weekly-mental-health-reports',
  schedule: '0 18 * * 5', // كل جمعة 6 مساءً
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.users.list);
    
    await Promise.all(users.map(async (user) => {
      const analysis = await ctx.runQuery(internal.emails.getWeeklyAnalysis, {
        userId: user._id
      });
      
      await ctx.runAction(internal.resend.sendEmail, {
        to: user.email,
        template: 'mentalHealthReport',
        data: {
          name: user.name,
          positivityScore: analysis.positivityScore,
          recommendations: analysis.recommendations
        }
      });
    });
  }
});