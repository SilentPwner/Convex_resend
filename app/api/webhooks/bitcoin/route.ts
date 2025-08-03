// lifesync/app/api/webhooks/bitcoin/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { validateBitcoinWebhook } from '@/convex/utils/validation';
import { handleBitcoinPayment } from '@/convex/actions/crypto/payments';

export const POST = async (req: Request) => {
  try {
    // 1. التحقق من صحة الطلب
    const authError = await validateBitcoinWebhook(req);
    if (authError) return authError;

    // 2. قراءة وتحليل البيانات
    const payload = await req.json();
    const signature = headers().get('x-coinpayments-signature');
    const ipnSecret = process.env.BITCOIN_IPN_SECRET!;

    // 3. التحقق من التوقيع
    const isValid = verifyBitcoinSignature(payload, signature, ipnSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // 4. معالجة الحدث حسب النوع
    const result = await handleBitcoinPayment({
      eventType: payload.ipn_type,
      payment: {
        id: payload.txn_id,
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status,
        address: payload.address,
        confirms: payload.confirms,
        metadata: payload.custom && JSON.parse(payload.custom)
      }
    });

    // 5. تسجيل النتيجة
    console.log(`Processed Bitcoin ${payload.ipn_type} event`, result);
    
    return NextResponse.json(
      { success: true, processed: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Bitcoin webhook processing failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid webhook' 
      },
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

function verifyBitcoinSignature(
  payload: any,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  
  const hmac = require('crypto').createHmac('sha512', secret);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  
  return signature === calculatedSignature;
}