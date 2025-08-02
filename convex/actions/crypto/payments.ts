// convex/actions/crypto/payments.ts
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { getCryptoRates, validateAddress } from "../../../lib/cryptoUtils";
import { sendPaymentNotification } from "../notifications";

// أنواع العملات المدعومة
const SUPPORTED_CRYPTOS = ["BTC", "ETH", "USDT"] as const;
type CryptoType = typeof SUPPORTED_CRYPTOS[number];

/**
 * إنشاء فاتورة دفع مشفرة
 */
export const createPayment = action({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.union(v.literal("USD"), v.literal("EUR")),
    cryptoType: v.union(
      v.literal("BTC"),
      v.literal("ETH"),
      v.literal("USDT")
    ),
    projectId: v.optional(v.id("projects"))
  },
  handler: async (ctx, args) => {
    // 1. التحقق من صحة العملة
    if (!SUPPORTED_CRYPTOS.includes(args.cryptoType)) {
      throw new Error("Unsupported cryptocurrency");
    }

    // 2. الحصول على أسعار الصرف
    const rates = await getCryptoRates(args.currency);
    const cryptoAmount = args.amount / rates[args.cryptoType];

    // 3. إنشاء عنوان استلام
    const address = await generateCryptoAddress(ctx, args.userId, args.cryptoType);

    // 4. إنشاء سجل الدفع
    const paymentId = await ctx.runMutation("payments:createRecord", {
      userId: args.userId,
      amount: args.amount,
      currency: args.currency,
      cryptoType: args.cryptoType,
      cryptoAmount,
      address,
      status: "pending",
      projectId: args.projectId,
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 دقيقة
    });

    // 5. إرسال إشعار بالمحفظة
    await sendPaymentNotification(ctx, {
      userId: args.userId,
      paymentId,
      cryptoType: args.cryptoType,
      address,
      amount: cryptoAmount
    });

    return {
      paymentId,
      address,
      cryptoAmount,
      fiatAmount: args.amount,
      currency: args.currency,
      cryptoType: args.cryptoType,
      expiration: new Date(Date.now() + 30 * 60 * 1000)
    };
  }
});

/**
 * التحقق من حالة الدفع
 */
export const checkPaymentStatus = internalAction({
  args: {
    paymentId: v.id("cryptoPayments")
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات الدفع
    const payment = await ctx.runQuery("payments:getById", { id: args.paymentId });
    if (payment.status !== "pending") {
      return payment;
    }

    // 2. التحقق من المعاملة على الشبكة
    const { received, txHash } = await verifyTransaction(
      payment.cryptoType,
      payment.address,
      payment.cryptoAmount
    );

    // 3. تحديث حالة الدفع إذا تم التأكيد
    if (received) {
      await ctx.runMutation("payments:updateStatus", {
        paymentId: args.paymentId,
        status: "completed",
        txHash
      });

      // 4. إذا كان مرتبط بمشروع، إنشاء تبرع
      if (payment.projectId) {
        await ctx.runMutation("donations:createFromPayment", {
          paymentId: args.paymentId,
          userId: payment.userId,
          projectId: payment.projectId,
          amount: payment.amount,
          currency: payment.currency,
          cryptoAmount: payment.cryptoAmount,
          cryptoType: payment.cryptoType,
          txHash
        });
      }

      // 5. إرسال إشعار التأكيد
      await sendPaymentNotification(ctx, {
        userId: payment.userId,
        paymentId: args.paymentId,
        status: "completed",
        txHash
      });
    }

    return {
      ...payment,
      received,
      confirmed: received >= payment.cryptoAmount
    };
  }
});

// ===== الدوال المساعدة ===== //

/**
 * إنشاء عنوان عملة مشفرة
 */
async function generateCryptoAddress(
  ctx: any,
  userId: string,
  cryptoType: CryptoType
): Promise<string> {
  switch (cryptoType) {
    case "BTC":
      const btc = await ctx.runAction("crypto/bitcoin:generateAddress", { userId });
      return btc.address;
    case "ETH":
      const eth = await ctx.runAction("crypto/ethereum:generateAddress", { userId });
      return eth.address;
    case "USDT":
      const usdt = await ctx.runAction("crypto/usdt:generateAddress", { userId });
      return usdt.address;
    default:
      throw new Error("Unsupported cryptocurrency");
  }
}

/**
 * التحقق من المعاملة على الشبكة
 */
async function verifyTransaction(
  cryptoType: CryptoType,
  address: string,
  expectedAmount: number
): Promise<{ received: number; txHash?: string }> {
  try {
    let received = 0;
    let txHash = "";

    switch (cryptoType) {
      case "BTC":
        const btcTx = await checkBitcoinTransaction(address, expectedAmount);
        received = btcTx.received;
        txHash = btcTx.txHash;
        break;
      case "ETH":
        const ethTx = await checkEthereumTransaction(address, expectedAmount);
        received = ethTx.received;
        txHash = ethTx.txHash;
        break;
      case "USDT":
        const usdtTx = await checkUsdtTransaction(address, expectedAmount);
        received = usdtTx.received;
        txHash = usdtTx.txHash;
        break;
    }

    return { received, txHash };
  } catch (error) {
    console.error(`Failed to verify ${cryptoType} transaction:`, error);
    return { received: 0 };
  }
}

/**
 * التحقق من معاملة البيتكوين
 */
async function checkBitcoinTransaction(address: string, expectedAmount: number) {
  const response = await axios.get(`https://blockchain.info/rawaddr/${address}`);
  const txs = response.data.txs || [];
  
  const relevantTx = txs.find((tx: any) => 
    tx.out.some((o: any) => o.addr === address && o.value >= expectedAmount * 1e8)
  );

  return {
    received: relevantTx 
      ? relevantTx.out.find((o: any) => o.addr === address).value / 1e8 
      : 0,
    txHash: relevantTx?.txid
  };
}

/**
 * التحقق من معاملة الإيثيريوم
 */
async function checkEthereumTransaction(address: string, expectedAmount: number) {
  const response = await axios.get(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc`
  );
  
  const relevantTx = response.data.result.find(
    (tx: any) => tx.to.toLowerCase() === address.toLowerCase() && 
    parseFloat(tx.value) >= expectedAmount * 1e18
  );

  return {
    received: relevantTx ? parseFloat(relevantTx.value) / 1e18 : 0,
    txHash: relevantTx?.hash
  };
}

/**
 * التحقق من معاملة USDT
 */
async function checkUsdtTransaction(address: string, expectedAmount: number) {
  // USDT يستخدم Omni Layer أو ERC-20، هنا مثال لـ ERC-20
  const response = await axios.get(
    `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xdac17f958d2ee523a2206206994597c13d831ec7&address=${address}&sort=desc`
  );
  
  const relevantTx = response.data.result.find(
    (tx: any) => tx.to.toLowerCase() === address.toLowerCase() && 
    parseFloat(tx.value) >= expectedAmount * 1e6 // USDT يستخدم 6 منازل عشرية
  );

  return {
    received: relevantTx ? parseFloat(relevantTx.value) / 1e6 : 0,
    txHash: relevantTx?.hash
  };
}