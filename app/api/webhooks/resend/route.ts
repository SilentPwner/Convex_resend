// lifesync/app/api/webhooks/resend/route.ts
import { NextResponse } from 'next/server';
import { validateRequest } from '@/convex/utils/validation';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { handleEmailEvent } from '@/convex/actions/resend/webhooks';

export const POST = async (req: Request) => {
  try {
    // 1. التحقق من صحة الطلب
    const authError = await validateRequest(req, 'resend');
    if (authError) return authError;

    // 2. قراءة وتفسير بيانات Webhook
    const payload = await req.json();
    const svixHeaders = headers();
    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);

    // 3. التحقق من توقيع Webhook
    const verifiedPayload = wh.verify(
      JSON.stringify(payload),
      {
        'svix-id': svixHeaders.get('svix-id')!,
        'svix-timestamp': svixHeaders.get('svix-timestamp')!,
        'svix-signature': svixHeaders.get('svix-signature')!
      }
    ) as ResendWebhookEvent;

    // 4. معالجة الحدث حسب النوع
    const result = await handleEmailEvent(verifiedPayload);

    // 5. تسجيل النتيجة
    console.log(`Processed ${verifiedPayload.type} event`, result);
    
    return NextResponse.json(
      { success: true, processed: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid webhook' },
      { status: 400 }
    );
  }
};

export const GET = () => {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
};

// أنواع أحداث Resend Webhook
type ResendWebhookEvent = {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
  data: {
    email_id: string;
    to: string;
    from: string;
    subject?: string;
    created_at: string;
    metadata?: {
      user_id?: string;
      product_id?: string;
      alert_type?: string;
    };
    click_data?: {
      link: string;
      ip: string;
    };
  };
};