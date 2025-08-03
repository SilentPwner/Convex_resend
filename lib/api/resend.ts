// lib/api/resend.ts

import { Resend } from 'resend';
import { EMAIL_SETTINGS } from '@/lib/constants';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { 
  PriceAlertProps, 
  DonationReceiptProps, 
  HealthReportProps 
} from '@/components/email-templates';

// إنشاء عميل Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال بريد إلكتروني باستخدام قالب React
 * @param to عنوان البريد الإلكتروني للمستلم
 * @param subject موضوع البريد
 * @param template قالب React
 * @param props خصائص القالب
 * @param options خيارات إضافية
 * @returns نتيجة الإرسال
 */
async function sendEmail<T>(
  to: string,
  subject: string,
  template: (props: T) => ReactElement,
  props: T,
  options?: {
    cc?: string;
    bcc?: string;
    reply_to?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
    }>;
  }
) {
  try {
    // تحويل قالب React إلى HTML
    const html = renderToString(template(props));
    
    // إرسال البريد الإلكتروني
    const data = await resend.emails.send({
      from: EMAIL_SETTINGS.FROM,
      to,
      subject,
      html,
      cc: options?.cc,
      bcc: options?.bcc,
      reply_to: options?.reply_to || EMAIL_SETTINGS.REPLY_TO,
      attachments: options?.attachments,
    });

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, data: null, error };
  }
}

/**
 * إرسال تنبيه أسعار
 * @param params خصائص تنبيه الأسعار
 * @returns نتيجة الإرسال
 */
export async function sendPriceAlertEmail(params: PriceAlertProps) {
  const { to, productName, currentPrice, targetPrice } = params;
  
  // استيراد القالب ديناميكياً لتجنب مشاكل التبعيات
  const { PriceAlert } = await import('@/components/email-templates/PriceAlert');
  
  return sendEmail(
    to,
    `Price Alert: ${productName} reached your target price!`,
    PriceAlert,
    params
  );
}

/**
 * إرسال إيصال تبرع
 * @param params خصائص إيصال التبرع
 * @returns نتيجة الإرسال
 */
export async function sendDonationReceiptEmail(params: DonationReceiptProps) {
  const { to, donorName, amount, currency } = params;
  
  // استيراد القالب ديناميكياً
  const { DonationReceipt } = await import('@/components/email-templates/DonationReceipt');
  
  return sendEmail(
    to,
    `Donation Receipt: Thank you for your contribution!`,
    DonationReceipt,
    params,
    {
      attachments: [
        {
          filename: `Donation-Receipt-${Date.now()}.pdf`,
          content: await generateReceiptPDF(params),
        }
      ]
    }
  );
}

/**
 * إرسال تقرير صحي
 * @param params خصائص التقرير الصحي
 * @returns نتيجة الإرسال
 */
export async function sendHealthReportEmail(params: HealthReportProps) {
  const { to, userName, reportDate } = params;
  
  // استيراد القالب ديناميكياً
  const { HealthReport } = await import('@/components/email-templates/HealthReport');
  
  return sendEmail(
    to,
    `Health Report: Your wellness summary for ${reportDate}`,
    HealthReport,
    params
  );
}

/**
 * توليد ملف PDF للإيصال (وظيفة مساعدة)
 * @param params خصائص الإيصال
 * @returns محتوى PDF كـ Buffer
 */
async function generateReceiptPDF(params: DonationReceiptProps): Promise<Buffer> {
  // في التطبيق الحقيقي، سيتم استخدام مكتبة مثل pdfkit أو puppeteer
  // هنا نستخدم تنفيذ وهمي لأغراض التوضيح
  return Buffer.from(`Donation Receipt\n\nName: ${params.donorName}\nAmount: ${params.amount} ${params.currency}\nDate: ${new Date().toISOString()}`);
}

/**
 * إرسال بريد التحقق
 * @param params خصائص بريد التحقق
 * @returns نتيجة الإرسال
 */
export async function sendVerificationEmail(params: {
  to: string;
  userName: string;
  verificationLink: string;
}) {
  return sendEmail(
    params.to,
    'Verify your email address',
    (props) => (
      <div>
        <h1>Hi {props.userName},</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href={props.verificationLink}>Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    ),
    params
  );
}

/**
 * إرسال بريد إعادة تعيين كلمة المرور
 * @param params خصائص إعادة تعيين كلمة المرور
 * @returns نتيجة الإرسال
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetLink: string;
  expiresAt: Date;
}) {
  const { to, userName, resetLink, expiresAt } = params;
  
  return sendEmail(
    to,
    'Password Reset Request',
    (props) => (
      <div>
        <h1>Hi {props.userName},</h1>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <a href={props.resetLink}>Reset Password</a>
        <p>This link will expire at {props.expiresAt.toLocaleString()}.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    ),
    params
  );
}