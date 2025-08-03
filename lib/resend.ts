import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendToneAlert(email: string, analysis: any) {
  await resend.emails.send({
    from: 'alerts@lifesync.ai',
    to: email,
    subject: 'تحليل نبرة بريدك الإلكتروني',
    react: <ToneAlertEmail {...analysis} />
  });
}

// أضف دوال أخرى حسب الحاجة