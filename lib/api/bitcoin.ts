// lib/api/bitcoin.ts

import axios from 'axios';
import { BITCOIN_SETTINGS, ERROR_CODES } from '@/lib/constants';
import { convertBitcoinUnits, handleError } from '@/lib/utils';

// إعداد عميل HTTP
const bitcoinApi = axios.create({
  baseURL: BITCOIN_SETTINGS.EXPLORER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * الحصول على سعر البيتكوين الحالي
 * @param currency العملة المستهدفة (default: USD)
 * @returns السعر الحالي للبيتكوين
 */
export async function getBitcoinPrice(
  currency: string = 'USD'
): Promise<number> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin',
          vs_currencies: currency.toLowerCase(),
        },
      }
    );

    const price = response.data.bitcoin[currency.toLowerCase()];
    if (!price) throw new Error('Invalid currency');

    return price;
  } catch (error) {
    throw new Error(handleError(error, ERROR_CODES.THIRD_PARTY_FAILURE));
  }
}

/**
 * الحصول على معلومات المحفظة
 * @param address عنوان البيتكوين
 * @returns معلومات المحفظة
 */
export async function getWalletBalance(
  address: string
): Promise<{ balance: number; unconfirmed_balance: number; total_received: number }> {
  try {
    const response = await bitcoinApi.get(`/address/${address}`);
    return {
      balance: response.data.final_balance,
      unconfirmed_balance: response.data.unconfirmed_balance,
      total_received: response.data.total_received,
    };
  } catch (error) {
    throw new Error(handleError(error, ERROR_CODES.INVALID_ADDRESS));
  }
}

/**
 * الحصول على سجل المعاملات
 * @param address عنوان البيتكوين
 * @param limit الحد الأقصى لعدد المعاملات (default: 10)
 * @returns سجل المعاملات
 */
export async function getTransactionHistory(
  address: string,
  limit: number = 10
): Promise<Array<{
  hash: string;
  confirmed: boolean;
  date: Date;
  amount: number;
  fee: number;
  confirmations: number;
}>> {
  try {
    const response = await bitcoinApi.get(`/address/${address}/txs`, {
      params: { limit },
    });

    return response.data.map((tx: any) => ({
      hash: tx.hash,
      confirmed: tx.confirmed !== undefined,
      date: new Date(tx.confirmed),
      amount: tx.inputs
        .filter((input: any) => input.prev_out.addr === address)
        .reduce((sum: number, input: any) => sum + input.prev_out.value, 0),
      fee: tx.fee,
      confirmations: tx.confirmations,
    }));
  } catch (error) {
    throw new Error(handleError(error, ERROR_CODES.THIRD_PARTY_FAILURE));
  }
}

/**
 * تقدير رسوم المعاملة
 * @param inputs عدد المدخلات
 * @param outputs عدد المخرجات
 * @returns الرسوم المقدرة (سنتوشي/بايت)
 */
export async function estimateTransactionFee(
  inputs: number = 1,
  outputs: number = 2
): Promise<number> {
  try {
    const response = await axios.get(
      'https://mempool.space/api/v1/fees/recommended'
    );
    
    // تقدير حجم المعاملة
    const txSize = inputs * 148 + outputs * 34 + 10;
    
    // استخدام الرسوم المتوسطة
    return txSize * response.data.halfHourFee;
  } catch (error) {
    // قيمة افتراضية في حالة الفشل
    return 100;
  }
}

/**
 * مراقبة المعاملات الواردة لمحفظة
 * @param address عنوان البيتكوين
 * @param callback دالة الاستدعاء عند اكتشاف معاملة جديدة
 * @param interval فترة المراقبة (default: 60 seconds)
 * @returns وظيفة لإيقاف المراقبة
 */
export function monitorIncomingTransactions(
  address: string,
  callback: (transaction: any) => void,
  interval: number = 60000
): () => void {
  let lastCheckedTxId: string | null = null;
  
  const checkTransactions = async () => {
    try {
      const history = await getTransactionHistory(address, 5);
      
      if (history.length > 0) {
        // البحث عن معاملات جديدة
        const newTransactions = lastCheckedTxId
          ? history.filter(tx => tx.hash !== lastCheckedTxId)
          : [history[0]];
        
        if (newTransactions.length > 0) {
          newTransactions.forEach(callback);
          lastCheckedTxId = newTransactions[0].hash;
        }
      }
    } catch (error) {
      console.error('Transaction monitoring error:', error);
    }
  };
  
  // البدء بالمراقبة
  const timer = setInterval(checkTransactions, interval);
  checkTransactions(); // الفحص الأولي
  
  // إرجاع وظيفة الإيقاف
  return () => clearInterval(timer);
}

/**
 * التحقق من تأكيد المعاملة
 * @param txHash هاش المعاملة
 * @returns عدد التأكيدات
 */
export async function getTransactionConfirmations(
  txHash: string
): Promise<number> {
  try {
    const response = await bitcoinApi.get(`/tx/${txHash}`);
    return response.data.confirmations || 0;
  } catch (error) {
    throw new Error(handleError(error, ERROR_CODES.TRANSACTION_FAILED));
  }
}

/**
 * إنشاء معاملة غير موقعة
 * @param fromAddress عنوان المرسل
 * @param toAddress عنوان المستلم
 * @param amount المبلغ (بالساتوشي)
 * @param fee الرسوم (بالساتوشي)
 * @returns المعاملة غير الموقعة
 */
export async function createUnsignedTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  fee: number
): Promise<{ hex: string; inputs: any[] }> {
  try {
    // الحصول على UTXOs غير المنفقة
    const utxoResponse = await bitcoinApi.get(`/address/${fromAddress}/utxo`);
    const utxos = utxoResponse.data;
    
    if (utxos.length === 0) {
      throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
    }
    
    // حساب المبلغ الإجمالي المتاح
    const totalAvailable = utxos.reduce((sum: number, utxo: any) => sum + utxo.value, 0);
    const amountSat = amount;
    const feeSat = fee;
    
    // التحقق من وجود رصيد كافي
    if (totalAvailable < amountSat + feeSat) {
      throw new Error(ERROR_CODES.INSUFFICIENT_FUNDS);
    }
    
    // إنشاء المعاملة (هذا تنفيذ مبسط)
    // في التطبيق الحقيقي، نستخدم مكتبة مثل bitcoinjs-lib
    return {
      hex: '010000000001...', // معاملة وهمية
      inputs: utxos.map((utxo: any) => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_output_n,
        value: utxo.value,
      })),
    };
  } catch (error) {
    throw new Error(handleError(error));
  }
}

/**
 * بث المعاملة إلى الشبكة
 * @param txHex المعاملة بصيغة HEX
 * @returns هاش المعاملة
 */
export async function broadcastTransaction(
  txHex: string
): Promise<string> {
  try {
    const response = await bitcoinApi.post('/tx/send', {
      tx: txHex,
    });
    
    if (response.data.tx && response.data.tx.hash) {
      return response.data.tx.hash;
    }
    
    throw new Error('Broadcast failed: ' + JSON.stringify(response.data));
  } catch (error) {
    throw new Error(handleError(error, ERROR_CODES.TRANSACTION_FAILED));
  }
}

/**
 * التحقق من صحة عنوان البيتكوين
 * @param address عنوان البيتكوين
 * @returns صحة العنوان
 */
export function validateBitcoinAddress(
  address: string
): boolean {
  // التحقق الأساسي من البداية
  if (BITCOIN_SETTINGS.NETWORK === 'mainnet') {
    return address.startsWith('1') || 
           address.startsWith('3') || 
           address.startsWith('bc1');
  } else {
    return address.startsWith('m') || 
           address.startsWith('n') || 
           address.startsWith('2') || 
           address.startsWith('tb1');
  }
}

/**
 * تحويل الساتوشي إلى BTC
 * @param satoshi المبلغ بالساتوشي
 * @returns المبلغ بالـ BTC
 */
export function satoshiToBtc(satoshi: number): number {
  return convertBitcoinUnits(satoshi, 'SAT', 'BTC');
}

/**
 * تحويل BTC إلى ساتوشي
 * @param btc المبلغ بالـ BTC
 * @returns المبلغ بالساتوشي
 */
export function btcToSatoshi(btc: number): number {
  return convertBitcoinUnits(btc, 'BTC', 'SAT');
}