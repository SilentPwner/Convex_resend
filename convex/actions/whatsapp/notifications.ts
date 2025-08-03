// convex/actions/whatsapp/notifications.ts
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { getMessageContent } from "../../../lib/whatsappTemplates";

// ===== حالة العميل والإعدادات =====
let whatsappClient: Client | null = null;

// ===== أنواع البيانات =====
type NotificationType = 
  | "price_alert" 
  | "donation_confirmation" 
  | "mental_health_alert" 
  | "weekly_report";

interface WhatsAppEvent {
  type: 'message' | 'status';
  data: {
    messageId: string;
    phone: string;
    user: { phone: string };
    timestamp: number;
    text?: string;
    status?: string;
    from?: string;
  };
}

// ===== الوظائف الأساسية =====

/**
 * تهيئة عميل واتساب
 */
function initializeWhatsAppClient() {
  if (whatsappClient) return whatsappClient;

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "lifesync" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    webVersionCache: {
      type: "remote",
      remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
    }
  });

  whatsappClient.on("qr", (qr) => {
    console.log("WhatsApp QR Code:");
    qrcode.generate(qr, { small: true });
  });

  whatsappClient.on("ready", () => {
    console.log("WhatsApp client is ready!");
  });

  whatsappClient.on("auth_failure", (msg) => {
    console.error("WhatsApp auth failure:", msg);
    whatsappClient = null;
  });

  whatsappClient.initialize();
  return whatsappClient;
}

// ===== معالجة الأحداث الواردة =====

export const handleWhatsAppEvent = internalAction({
  args: {
    eventType: v.string(),
    data: v.object({
      type: v.string(),
      from: v.optional(v.string()),
      text: v.optional(v.string()),
      status: v.optional(v.string()),
      messageId: v.string(),
      phone: v.string(),
      user: v.object({ phone: v.string() }),
      timestamp: v.number()
    })
  },
  handler: async (ctx, { eventType, data }) => {
    // 1. تسجيل الحدث
    await ctx.runMutation(internal.whatsapp.logEvent, {
      eventType,
      messageId: data.messageId,
      phone: data.phone,
      userId: await getUserIdByPhone(ctx, data.user.phone),
      status: data.status,
      content: data.text,
      timestamp: new Date(data.timestamp * 1000).toISOString()
    });

    // 2. معالجة حسب نوع الحدث
    switch (data.type) {
      case 'message':
        await handleIncomingMessage(ctx, data);
        break;
      case 'status':
        await handleStatusUpdate(ctx, data);
        break;
    }

    return { success: true };
  }
});

// ===== إرسال الإشعارات =====

export const sendWhatsAppNotification = action({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("price_alert"),
      v.literal("donation_confirmation"),
      v.literal("mental_health_alert"),
      v.literal("weekly_report")
    ),
    data: v.any()
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.get, { id: args.userId });
    if (!user?.phone) {
      await logFailedNotification(ctx, user._id, args.type, "No phone number");
      return { success: false, error: "No phone number available" };
    }

    if (!user.notificationPreferences?.whatsapp) {
      return { success: false, error: "WhatsApp notifications disabled" };
    }

    const client = initializeWhatsAppClient();
    if (!client) throw new Error("WhatsApp client not initialized");

    const { message, media } = await getMessageContent(args.type, args.data, user.language);

    try {
      const chatId = `${user.phone}@c.us`;
      let response;

      if (media) {
        const mediaData = await MessageMedia.fromUrl(media.url);
        response = await client.sendMessage(chatId, mediaData, {
          caption: message,
          sendMediaAsDocument: media.asDocument
        });
      } else {
        response = await client.sendMessage(chatId, message);
      }

      await logSentNotification(ctx, user._id, args.type, message, response.id.id);
      return { success: true, messageId: response.id.id };

    } catch (error) {
      await logFailedNotification(ctx, user._id, args.type, error.message);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }
});

// ===== إشعارات مخصصة =====

export const sendPriceAlert = action({
  args: {
    productId: v.id("trackedProducts"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const product = await ctx.runQuery(internal.products.getById, { id: args.productId });
    const discount = calculateDiscount(product.originalPrice, product.currentPrice);

    return ctx.runAction(internal.whatsapp.sendWhatsAppNotification, {
      userId: args.userId,
      type: "price_alert",
      data: {
        productName: product.name,
        oldPrice: product.originalPrice,
        newPrice: product.currentPrice,
        discount,
        productUrl: product.productUrl,
        imageUrl: product.imageUrl
      }
    });
  }
});

export const sendDonationConfirmation = action({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const donation = await ctx.runQuery(internal.donations.getById, { id: args.donationId });
    const project = await ctx.runQuery(internal.projects.getById, { id: donation.projectId });

    return ctx.runAction(internal.whatsapp.sendWhatsAppNotification, {
      userId: args.userId,
      type: "donation_confirmation",
      data: {
        amount: donation.amount,
        currency: donation.currency,
        projectName: project.name,
        transactionHash: donation.txHash,
        impact: project.impactDescription
      }
    });
  }
});

// ===== دوال مساعدة =====

async function getUserIdByPhone(ctx: any, phone: string) {
  return ctx.runQuery(internal.users.getIdByPhone, { phone });
}

async function handleIncomingMessage(ctx: any, data: any) {
  if (data.text?.includes('تتبع')) {
    await ctx.runAction(internal.notifications.sendTrackingUpdate, {
      userId: await getUserIdByPhone(ctx, data.user.phone),
      message: data.text
    });
  }
}

async function handleStatusUpdate(ctx: any, data: any) {
  if (data.status === 'delivered') {
    await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
      messageId: data.messageId,
      status: 'delivered',
      deliveredAt: new Date(data.timestamp * 1000).toISOString()
    });
  }
}

async function logSentNotification(
  ctx: any, 
  userId: string, 
  type: string, 
  content: string, 
  messageId: string
) {
  await ctx.runMutation(internal.notifications.logSent, {
    userId,
    type,
    content,
    messageId,
    timestamp: Date.now()
  });
}

async function logFailedNotification(
  ctx: any, 
  userId: string, 
  type: string, 
  error: string
) {
  await ctx.runMutation(internal.notifications.logFailed, {
    userId,
    type,
    error
  });
}

function calculateDiscount(oldPrice: number, newPrice: number): number {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

// ===== تصدير الواجهة =====
export const whatsapp = {
  handleEvent: handleWhatsAppEvent,
  sendNotification: sendWhatsAppNotification,
  sendPriceAlert,
  sendDonationConfirmation
};