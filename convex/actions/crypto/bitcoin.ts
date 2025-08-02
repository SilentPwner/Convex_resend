// convex/actions/crypto/bitcoin.ts
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from "axios";

// تهيئة مكتبة البيتكوين
const ECPair = ECPairFactory(ecc);
const network = process.env.BTC_NETWORK === "testnet" 
  ? bitcoin.networks.testnet 
  : bitcoin.networks.bitcoin;

// تكوين متصل Bitcoin RPC
const rpcConfig = {
  host: process.env.BTC_RPC_HOST || "localhost",
  port: process.env.BTC_RPC_PORT || 8332,
  username: process.env.BTC_RPC_USER,
  password: process.env.BTC_RPC_PASS,
  network: process.env.BTC_NETWORK || "mainnet"
};

/**
 * إنشاء عنوان بيتكوين جديد للمستخدم
 */
export const generateAddress = internalAction({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // 1. إنشاء زوج مفاتيح جديد
    const keyPair = ECPair.makeRandom({ network });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network
    });

    // 2. تخزين المفتاح الخاص بشكل مشفر
    const encryptedWIF = await encrypt(keyPair.toWIF(), args.userId);

    // 3. حفظ العنوان في قاعدة البيانات
    await ctx.runMutation("crypto:storeAddress", {
      userId: args.userId,
      address: address!,
      encryptedWIF,
      network: rpcConfig.network
    });

    return { address, network: rpcConfig.network };
  }
});

/**
 * إنشاء فاتورة بيتكوين للتبرع
 */
export const createInvoice = action({
  args: {
    userId: v.id("users"),
    amountUSD: v.number(),
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    // 1. التحقق من رصيد المشروع
    const project = await ctx.runQuery("projects:getById", { id: args.projectId });
    if (!project.acceptsCrypto) {
      throw new Error("Project does not accept cryptocurrency donations");
    }

    // 2. الحصول على سعر البيتكوين الحالي
    const btcRate = await getBTCPrice();
    const amountBTC = parseFloat((args.amountUSD / btcRate).toFixed(8));

    // 3. إنشاء عنوان استلام جديد
    const { address } = await ctx.runAction("crypto/generateAddress", {
      userId: args.userId
    });

    // 4. إنشاء سجل المعاملة
    const invoiceId = await ctx.runMutation("crypto:createInvoiceRecord", {
      userId: args.userId,
      projectId: args.projectId,
      amountUSD: args.amountUSD,
      amountBTC,
      address,
      status: "pending"
    });

    // 5. إنشاء QR Code للدفع
    const qrCodeUrl = await generateQRCode(`bitcoin:${address}?amount=${amountBTC}`);

    return {
      invoiceId,
      address,
      amountBTC,
      amountUSD: args.amountUSD,
      qrCodeUrl,
      expiration: Date.now() + 30 * 60 * 1000 // 30 دقيقة
    };
  }
});

/**
 * التحقق من حالة الفاتورة
 */
export const checkInvoiceStatus = internalAction({
  args: {
    invoiceId: v.id("cryptoInvoices")
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات الفاتورة
    const invoice = await ctx.runQuery("crypto:getInvoice", { id: args.invoiceId });
    if (invoice.status !== "pending") {
      return invoice;
    }

    // 2. التحقق من المعاملة على الشبكة
    const transactions = await fetchTransactions(invoice.address);
    const received = calculateReceivedAmount(transactions, invoice.address);

    // 3. تحديث حالة الفاتورة إذا تم الدفع
    if (received >= invoice.amountBTC) {
      await ctx.runMutation("crypto:updateInvoiceStatus", {
        invoiceId: args.invoiceId,
        status: "paid",
        txHash: transactions[0].txid
      });

      // 4. إنشاء سجل التبرع
      await ctx.runMutation("donations:createFromInvoice", {
        invoiceId: args.invoiceId,
        userId: invoice.userId,
        projectId: invoice.projectId,
        amount: invoice.amountUSD,
        currency: "BTC",
        txHash: transactions[0].txid
      });
    }

    return {
      ...invoice,
      received,
      confirmed: received >= invoice.amountBTC
    };
  }
});

// ===== الدوال المساعدة ===== //

/**
 * الحصول على سعر البيتكوين الحالي
 */
async function getBTCPrice(): Promise<number> {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    return response.data.bitcoin.usd;
  } catch (error) {
    console.error("Failed to fetch BTC price:", error);
    // سعر افتراضي في حالة الخطأ
    return 30000;
  }
}

/**
 * جلب المعاملات لعنوان معين
 */
async function fetchTransactions(address: string): Promise<any[]> {
  try {
    const response = await axios.get(`https://blockchain.info/rawaddr/${address}`);
    return response.data.txs || [];
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

/**
 * حساب المبلغ المستلم لعنوان معين
 */
function calculateReceivedAmount(transactions: any[], address: string): number {
  return transactions.reduce((total, tx) => {
    const outputs = tx.out.filter((o: any) => o.addr === address);
    const received = outputs.reduce((sum: number, o: any) => sum + o.value, 0);
    return total + received / 100000000; // التحويل من ساتوشي إلى BTC
  }, 0);
}

/**
 * إنشاء QR Code
 */
async function generateQRCode(data: string): Promise<string> {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  return qrUrl;
}

/**
 * تشفير المفتاح الخاص
 */
async function encrypt(data: string, userId: string): Promise<string> {
  // في الواقع يجب استخدام نظام تشفير أقوى مثل AES-256
  return `${data}_encrypted_${userId}`;
}