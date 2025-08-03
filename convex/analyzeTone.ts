import { action } from './_generated/server';
import OpenAI from 'openai';
import { internal } from './_generated/api';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);

export const analyzeEmailTone = action({
  args: { emailId: v.id('emails') },
  handler: async (ctx, { emailId }) => {
    const email = await ctx.runQuery(internal.emails.get, { id: emailId });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Analyze email tone and respond ONLY with: positive, negative, or neutral"
      }, {
        role: "user",
        content: email.content
      }]
    });

    const tone = response.choices[0].message.content?.toLowerCase();
    await ctx.runMutation(internal.emails.updateTone, { emailId, tone });
    
    if (tone === 'negative') {
      await ctx.runAction(internal.resend.sendNegativeToneAlert, { 
        userId: email.userId,
        emailId 
      });
    }
  }
});