// convex/utils/validation.ts
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import crypto from "crypto";

// ======================================
// === أنواع البيانات ===
// ======================================

type WebhookProvider = 'resend' | 'whatsapp' | 'stripe' | 'bitcoin';
type WhatsAppEventType = 'message' | 'status' | 'verification';

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 
        'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
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
}

// ======================================
// === مخططات التحقق المشتركة ===
// ======================================

export const emailSchema = v.string().regex(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "يجب أن يكون بريدًا إلكترونيًا صالحًا"
);

export const passwordSchema = v.string().min(
  8,
  "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"
).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  "يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"
);

export const phoneSchema = v.string().regex(
  /^\+?[0-9]{10,15}$/,
  "يجب أن يكون رقم هاتف صالح"
);

export const bitcoinAddressSchema = v.string().regex(
  /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  "عنوان بيتكوين غير صالح"
);

// ======================================
// === دوال التحقق المخصصة ===
// ======================================

export const validateUserInput = (input: {
  email: string;
  password: string;
  name: string;
}) => {
  try {
    const schema = v.object({
      email: emailSchema,
      password: passwordSchema,
      name: v.string().min(2, "يجب أن يكون الاسم أكثر من حرفين"),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات المستخدم غير صالحة"
    );
  }
};

export const validateDonationInput = (input: {
  amount: number;
  currency: string;
  method: string;
}) => {
  try {
    const schema = v.object({
      amount: v.number().min(1, "يجب أن يكون المبلغ أكبر من الصفر"),
      currency: v.union(
        v.literal("USD"),
        v.literal("EUR"),
        v.literal("BTC")
      ),
      method: v.union(
        v.literal("credit_card"),
        v.literal("bitcoin"),
        v.literal("paypal")
      ),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات التبرع غير صالحة"
    );
  }
};

export const validateProductInput = (input: {
  name: string;
  price: number;
  category: string;
}) => {
  try {
    const schema = v.object({
      name: v.string().min(3, "يجب أن يكون الاسم أكثر من 3 أحرف"),
      price: v.number().min(0, "لا يمكن أن يكون السعر سالبًا"),
      category: v.union(
        v.literal("donation"),
        v.literal("subscription"),
        v.literal("digital"),
        v.literal("physical"),
        v.literal("service")
      ),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات المنتج غير صالحة"
    );
  }
};

// ======================================
// === أدوات التحقق المساعدة ===
// ======================================

export const validateRequiredFields = (
  input: Record<string, any>,
  requiredFields: string[]
) => {
  const missingFields = requiredFields.filter((field) => !input[field]);

  if (missingFields.length > 0) {
    throw new ConvexError(
      `الحقول التالية مطلوبة: ${missingFields.join(", ")}`
    );
  }
  return true;
};

export const validateEnum = <T extends string>(
  value: string,
  validValues: T[]
): value is T => {
  if (!validValues.includes(value as T)) {
    throw new ConvexError(
      `القيمة ${value} غير صالحة. القيم المسموحة: ${validValues.join(", ")}`
    );
  }
  return true;
};

export const validateDate = (date: string | Date) => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ConvexError("تاريخ غير صالح");
  }
  return parsedDate;
};

// ======================================
// === تحقق ويب هوك WhatsApp ===
// ======================================

const verifyWhatsAppSignature = (payload: any, signature: string | null): boolean => {
  if (!signature || !process.env.WHATSAPP_WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET);
  const expectedSignature = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;
  return signature === expectedSignature;
};

export const validateWhatsAppWebhook = async (req: Request): Promise<NextResponse | null> => {
  // التحقق من طلبات GET (للتأكيد الأولي)
  if (req.method === 'GET') {
    const token = process.env.WHATSAPP_WEBHOOK_TOKEN;
    const verifyToken = req.nextUrl?.searchParams?.get('hub.verify_token');
    if (verifyToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
    return new NextResponse(req.nextUrl.searchParams.get('hub.challenge'), { status: 200 });
  }

  // التحقق من طلبات POST
  const signature = headers().get('x-hub-signature-256');
  const payload = await req.json().catch(() => null);

  if (!payload || !signature || !verifyWhatsAppSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  return null;
};

export const determineWhatsAppEventType = (payload: any): WhatsAppEventType => {
  if (payload.entry?.[0]?.changes?.[0]?.value?.messages) return 'message';
  if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) return 'status';
  return 'verification';
};

// ======================================
// === تحقق ويب هوك Resend ===
// ======================================

const validateResendWebhook = async (req: Request): Promise<NextResponse | null> => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token !== process.env.RESEND_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const svixHeaders = {
      'svix-id': headers().get('svix-id'),
      'svix-timestamp': headers().get('svix-timestamp'),
      'svix-signature': headers().get('svix-signature')
    };

    if (!svixHeaders['svix-id'] || !svixHeaders['svix-signature']) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const payload = await req.json();
    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
    wh.verify(JSON.stringify(payload), svixHeaders as any);

    return null;
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 403 });
  }
};

// ======================================
// === تحقق ويب هوك عام ===
// ======================================

const validateGenericWebhook = (req: Request, provider: WebhookProvider): NextResponse | null => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const expectedToken = process.env[`${provider.toUpperCase()}_WEBHOOK_TOKEN`];

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
  return null;
};

export const validateWebhookRequest = async (
  req: Request,
  provider: WebhookProvider
): Promise<NextResponse | null> => {
  switch (provider) {
    case 'resend':
      return await validateResendWebhook(req);
    case 'whatsapp':
      return await validateWhatsAppWebhook(req);
    default:
      return validateGenericWebhook(req, provider);
  }
};

// ======================================
// === تصدير الواجهة الرئيسية ===
// ======================================

export const validation = {
  schemas: {
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    bitcoinAddress: bitcoinAddressSchema,
  },
  validate: {
    user: validateUserInput,
    donation: validateDonationInput,
    product: validateProductInput,
    requiredFields: validateRequiredFields,
    enum: validateEnum,
    date: validateDate,
  },
  webhook: {
    validate: validateWebhookRequest,
    resend: validateResendWebhook,
    whatsapp: {
      validate: validateWhatsAppWebhook,
      verifySignature: verifyWhatsAppSignature,
      determineEventType: determineWhatsAppEventType,
    }
  }
};