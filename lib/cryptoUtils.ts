// lib/cryptoUtils.ts
import axios from "axios";

// أسعار العملات المشفرة
export async function getCryptoRates(baseCurrency: string) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=${baseCurrency.toLowerCase()}`
  );
  
  return {
    BTC: response.data.bitcoin[baseCurrency.toLowerCase()],
    ETH: response.data.ethereum[baseCurrency.toLowerCase()],
    USDT: response.data.tether[baseCurrency.toLowerCase()]
  };
}

// التحقق من صحة العنوان
export function validateAddress(cryptoType: string, address: string): boolean {
  switch (cryptoType) {
    case "BTC":
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
             /^bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71}$/.test(address);
    case "ETH":
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case "USDT":
      return validateAddress("ETH", address); // USDT يستخدم عناوين ETH
    default:
      return false;
  }
}