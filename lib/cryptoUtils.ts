import axios from "axios";

export const crypto = {
  // الحصول على أسعار العملات
  async getRates(currency: string) {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=${currency}`);
    return {
      BTC: response.data.bitcoin[currency.toLowerCase()],
      ETH: response.data.ethereum[currency.toLowerCase()],
      USDT: response.data.tether[currency.toLowerCase()]
    };
  },

  // إنشاء عناوين جديدة
  async generateAddress(ctx: any, userId: string, cryptoType: string) {
    const actionMap: Record<string, string> = {
      BTC: "bitcoin:generateAddress",
      ETH: "ethereum:generateAddress",
      USDT: "usdt:generateAddress"
    };
    const result = await ctx.runAction(`crypto/${actionMap[cryptoType]}`, { userId });
    return result.address;
  },

  // التحقق من المعاملات
  async verifyTransaction(cryptoType: string, address: string, amount: number) {
    const verifiers: Record<string, any> = {
      BTC: this.verifyBitcoin,
      ETH: this.verifyEthereum,
      USDT: this.verifyUsdt
    };
    return await verifiers[cryptoType](address, amount);
  },

  async verifyBitcoin(address: string, amount: number) {
    const response = await axios.get(`https://blockchain.info/rawaddr/${address}`);
    const tx = response.data.txs.find((t: any) => 
      t.out.some((o: any) => o.addr === address && o.value >= amount * 1e8)
    );
    return {
      received: tx ? tx.out.find((o: any) => o.addr === address).value / 1e8 : 0,
      txHash: tx?.txid,
      confirms: tx?.confirmations || 0
    };
  },

  async verifyEthereum(address: string, amount: number) {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc`
    );
    const tx = response.data.result.find(
      (t: any) => t.to.toLowerCase() === address.toLowerCase() && 
      parseFloat(t.value) >= amount * 1e18
    );
    return {
      received: tx ? parseFloat(tx.value) / 1e18 : 0,
      txHash: tx?.hash,
      confirms: tx?.confirmations || 0
    };
  },

  async verifyUsdt(address: string, amount: number) {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xdac17f958d2ee523a2206206994597c13d831ec7&address=${address}&sort=desc`
    );
    const tx = response.data.result.find(
      (t: any) => t.to.toLowerCase() === address.toLowerCase() && 
      parseFloat(t.value) >= amount * 1e6
    );
    return {
      received: tx ? parseFloat(tx.value) / 1e6 : 0,
      txHash: tx?.hash,
      confirms: tx?.confirmations || 0
    };
  }
};