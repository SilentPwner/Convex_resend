// lifesync/app/api/webhooks/whatsapp/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { validateWhatsAppWebhook } from '@/convex/utils/validation';
import { handleWhatsAppEvent } from '@/convex/actions/whatsapp/notifications';

export const POST = async (req: Request) => {
  try {
    // 1. التحقق من صحة الطلب
    const authError = await validateWhatsAppWebhook(req);
    if (authError) return authError;

    // 2. قراءة وتحليل البيانات
    const payload = await req.json();
    const signature = headers().get('x-hub-signature-256');
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET!;

    // 3. التحقق من التوقيع
    const isValid = verifyWhatsAppSignature(payload, signature, secret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 4. معالجة أنواع الأحداث المختلفة
    const result = await handleWhatsAppEvent({
      eventType: determineEventType(payload),
      data: normalizePayload(payload)
    });

    return NextResponse.json(
      { success: true, processed: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
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

// ===== الدوال المساعدة ===== //
function verifyWhatsAppSignature(
  payload: any,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;
  
  return signature === calculatedSignature;
}

function determineEventType(payload: any): string {
  if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
    return 'message';
  }
  if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
    return 'status';
  }
  return 'unknown';
}

function normalizePayload(payload: any) {
  const entry = payload.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return {};

  // معالجة الرسائل
  if (entry.messages) {
    const message = entry.messages[0];
    return {
      type: 'message',
      from: message.from,
      timestamp: message.timestamp,
      messageId: message.id,
      text: message.text?.body,
      phone: entry.metadata.phone_number_id,
      user: { phone: message.from }
    };
  }

  // معالجة تحديثات الحالة
  if (entry.statuses) {
    const status = entry.statuses[0];
    return {
      type: 'status',
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp,
      phone: entry.metadata.phone_number_id,
      user: { phone: status.recipient_id }
    };
  }

  return payload;
}