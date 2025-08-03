import { action } from './_generated/server';
import { Resend } from 'resend';
import { internal } from './_generated/api';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const generateDonationReceipt = action({
  args: { donationId: v.id('donations') },
  handler: async (ctx, { donationId }) => {
    const donation = await ctx.runQuery(internal.donations.get, { id: donationId });
    const user = await ctx.runQuery(internal.users.get, { id: donation.userId });
    
    const pdfResponse = await fetch('https://pdf-service.lifesync.ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        template: 'donation-receipt',
        data: {
          name: user.name,
          amount: donation.amount,
          date: new Date().toLocaleDateString('ar-SA'),
          project: donation.project
        }
      })
    });
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    await resend.emails.send({
      from: 'donations@lifesync.ai',
      to: user.email,
      subject: 'إيصال تبرعك',
      attachments: [{
        filename: 'إيصال_تبرع.pdf',
        content: Buffer.from(pdfBuffer)
      }]
    });
  }
});