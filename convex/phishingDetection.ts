import { action } from './_generated/server';
import { internal } from './_generated/api';

export const checkForPhishing = action({
  args: { emailId: v.id('emails') },
  handler: async (ctx, { emailId }) => {
    const email = await ctx.runQuery(internal.emails.get, { id: emailId });
    
    const response = await fetch('https://phishing-detection.lifesync.ai/scan', {
      method: 'POST',
      body: JSON.stringify({
        content: email.content,
        links: extractLinks(email.content)
      })
    });
    
    const { isPhishing, reasons } = await response.json();
    
    if (isPhishing) {
      await ctx.runMutation(internal.emails.flagAsPhishing, {
        emailId,
        reasons
      });
      
      await ctx.runAction(internal.resend.sendPhishingAlert, {
        userId: email.userId,
        emailId
      });
    }
  }
});

function extractLinks(content: string): string[] {
  // استخراج جميع الروابط من النص
  return content.match(/https?:\/\/[^\s]+/g) || [];
}