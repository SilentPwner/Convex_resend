import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';

export const handleEmailEvent = internalAction({
  args: { 
    event: v.object({
      type: v.string(),
      data: v.object({
        email_id: v.string(),
        to: v.string(),
        from: v.string(),
        created_at: v.string(),
        metadata: v.optional(v.object({
          user_id: v.optional(v.string()),
          product_id: v.optional(v.string()),
          alert_type: v.optional(v.string())
        })),
        click_data: v.optional(v.object({
          link: v.string(),
          ip: v.string()
        }))
      })
    })
  },
  handler: async (ctx, { event }) => {
    // 1. تحديث حالة البريد في السجل
    await ctx.runMutation(internal.emails.updateStatus, {
      emailId: event.data.email_id,
      status: event.type.split('.')[1], // delivered, bounced, etc.
      timestamp: new Date(event.data.created_at).getTime(),
      ...(event.data.click_data && { 
        clickedLink: event.data.click_data.link,
        clickIp: event.data.click_data.ip
      })
    });

    // 2. معالجة خاصة لأنواع معينة
    switch (event.type) {
      case 'email.bounced':
        await handleBouncedEmail(ctx, event);
        break;
      case 'email.clicked':
        await handleLinkClick(ctx, event);
        break;
      case 'email.opened':
        await ctx.runMutation(internal.analytics.trackOpen, {
          emailId: event.data.email_id,
          userId: event.data.metadata?.user_id
        });
        break;
    }

    return { success: true };
  }
});

async function handleBouncedEmail(ctx: any, event: ResendWebhookEvent) {
  if (event.data.metadata?.user_id) {
    await ctx.runMutation(internal.users.markEmailProblem, {
      userId: event.data.metadata.user_id,
      reason: 'bounced'
    });
  }
}

async function handleLinkClick(ctx: any, event: ResendWebhookEvent) {
  const link = event.data.click_data?.link;
  if (link?.includes('unsubscribe')) {
    await ctx.runMutation(internal.users.updatePreferences, {
      userId: event.data.metadata?.user_id,
      emailAlerts: false
    });
  }
}