// convex/actions/crypto/payments.ts
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { crypto } from "../../../lib/cryptoUtils";
import { notifications } from "../notifications";
import { validate } from "../../utils/validation";

// ================ أنواع البيانات ================
const CRYPTO_TYPES = ["BTC", "ETH", "USDT"] as const;
const FIAT_CURRENCIES = ["USD", "EUR"] as const;

type CryptoType = typeof CRYPTO_TYPES[number];
type FiatCurrency = typeof FIAT_CURRENCIES[number];

interface PaymentInput {
  userId: string;
  amount: number;
  currency: FiatCurrency;
  cryptoType: CryptoType;
  projectId?: string;
}

interface TransactionResult {
  received: number;
  txHash?: string;
  confirms?: number;
}

// ================ الواجهة العامة ================
export const payment = {
  /**
   * إنشاء فاتورة دفع مشفرة
   */
  create: action({
    args: {
      userId: v.id("users"),
      amount: v.number(),
      currency: v.union(v.literal("USD"), v.literal("EUR")),
      cryptoType: v.union(v.literal("BTC"), v.literal("ETH"), v.literal("USDT")),
      projectId: v.optional(v.id("projects"))
    },
    handler: async (ctx, args) => {
      // التحقق من صحة المدخلات
      validate.cryptoType(args.cryptoType);
      validate.fiatCurrency(args.currency);
      validate.positiveNumber(args.amount);

      // إنشاء الدفعة
      return await createCryptoPayment(ctx, args);
    }
  }),

  /**
   * التحقق من حالة الدفع
   */
  checkStatus: internalAction({
    args: { paymentId: v.id("cryptoPayments") },
    handler: async (ctx, args) => {
      return await verifyPaymentStatus(ctx, args.paymentId);
    }
  }),

  /**
   * معالجة إشعارات الويب هوك
   */
  handleWebhook: internalAction({
    args: { 
      eventType: v.string(),
      payment: v.object({
        id: v.string(),
        amount: v.number(),
        currency: v.string(),
        status: v.number(),
        address: v.string(),
        confirms: v.number(),
        metadata: v.optional(v.any())
      })
    },
    handler: async (ctx, { eventType, payment }) => {
      return await processPaymentEvent(ctx, eventType, payment);
    }
  })
};

// ================ الدوال الأساسية ================
async function createCryptoPayment(ctx: any, input: PaymentInput) {
  // 1. الحصول على سعر الصرف
  const rates = await crypto.getRates(input.currency);
  const cryptoAmount = input.amount / rates[input.cryptoType];

  // 2. إنشاء عنوان استلام
  const address = await crypto.generateAddress(ctx, input.userId, input.cryptoType);

  // 3. إنشاء سجل الدفع
  const paymentId = await ctx.runMutation(internal.payments.create, {
    userId: input.userId,
    fiatAmount: input.amount,
    currency: input.currency,
    cryptoType: input.cryptoType,
    cryptoAmount,
    address,
    status: "pending",
    projectId: input.projectId,
    expiresAt: Date.now() + 30 * 60 * 1000 // 30 دقيقة
  });

  // 4. إرسال إشعار
  await notifications.paymentCreated(ctx, {
    userId: input.userId,
    paymentId,
    cryptoType: input.cryptoType,
    address,
    amount: cryptoAmount
  });

  return {
    paymentId,
    address,
    cryptoAmount,
    fiatAmount: input.amount,
    currency: input.currency,
    cryptoType: input.cryptoType,
    expiration: new Date(Date.now() + 30 * 60 * 1000)
  };
}

async function verifyPaymentStatus(ctx: any, paymentId: string) {
  // 1. جلب بيانات الدفع
  const payment = await ctx.runQuery(internal.payments.getById, { id: paymentId });
  if (payment.status !== "pending") return payment;

  // 2. التحقق من المعاملة
  const { received, txHash, confirms } = await crypto.verifyTransaction(
    payment.cryptoType,
    payment.address,
    payment.cryptoAmount
  );

  // 3. إذا تم الاستلام
  if (received >= payment.cryptoAmount) {
    await completePayment(ctx, paymentId, payment, txHash, confirms);
  }

  return {
    ...payment,
    received,
    confirmed: received >= payment.cryptoAmount,
    txHash,
    confirms
  };
}

async function processPaymentEvent(
  ctx: any,
  eventType: string,
  paymentData: any
) {
  // 1. تحديث حالة الدفع
  await ctx.runMutation(internal.payments.updateStatus, {
    paymentId: paymentData.id,
    status: mapPaymentStatus(paymentData.status),
    confirms: paymentData.confirms,
    amount: paymentData.amount,
    txHash: paymentData.txid
  });

  // 2. معالجة حسب نوع الحدث
  switch (eventType) {
    case "deposit":
      if (paymentData.status >= 100 && paymentData.metadata?.userId) {
        await completeDonation(ctx, paymentData);
      }
      break;
      
    case "api":
      await handleApiPayment(ctx, paymentData);
      break;
  }

  return { success: true };
}

// ================ دوال مساعدة ================
async function completePayment(
  ctx: any,
  paymentId: string,
  payment: any,
  txHash?: string,
  confirms?: number
) {
  // 1. تحديث حالة الدفع
  await ctx.runMutation(internal.payments.updateStatus, {
    paymentId,
    status: "completed",
    txHash,
    confirms
  });

  // 2. إذا كان مرتبط بمشروع، إنشاء تبرع
  if (payment.projectId) {
    await ctx.runMutation(internal.donations.createFromPayment, {
      paymentId,
      userId: payment.userId,
      projectId: payment.projectId,
      amount: payment.fiatAmount,
      currency: payment.currency,
      cryptoAmount: payment.cryptoAmount,
      cryptoType: payment.cryptoType,
      txHash
    });
  }

  // 3. إرسال إشعار التأكيد
  await notifications.paymentCompleted(ctx, {
    userId: payment.userId,
    paymentId,
    txHash
  });
}

async function completeDonation(ctx: any, paymentData: any) {
  await ctx.runMutation(internal.donations.completeCrypto, {
    userId: paymentData.metadata.userId,
    amount: paymentData.amount,
    currency: paymentData.currency || "USD",
    cryptoType: paymentData.coin || "BTC",
    transactionId: paymentData.id,
    confirms: paymentData.confirms
  });
}

function mapPaymentStatus(status: number): string {
  const statusMap: Record<number, string> = {
    [-1]: "cancelled",
    [0]: "pending",
    [1]: "processing",
    [100]: "completed"
  };
  return statusMap[status] || "unknown";
}

// ================ تصدير الواجهة ================
export const cryptoPayments = {
  create: payment.create,
  checkStatus: payment.checkStatus,
  handleWebhook: payment.handleWebhook
};