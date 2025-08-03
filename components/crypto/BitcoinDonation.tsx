// components/crypto/BitcoinDonation.tsx
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import QRCode from 'react-qr-code';

type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC';

interface BitcoinDonationProps {
  bitcoinAddress: string;
  onDonationSuccess?: (txId: string, amount: number, currency: Currency) => void;
  className?: string;
}

const BitcoinDonation: React.FC<BitcoinDonationProps> = ({
  bitcoinAddress,
  onDonationSuccess,
  className,
}) => {
  const [amount, setAmount] = useState<string>('0.00');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [btcAmount, setBtcAmount] = useState<string>('0');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);

  // Fetch BTC exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,gbp');
        const data = await response.json();
        setExchangeRate(data.bitcoin[currency.toLowerCase()]);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currency]);

  // Convert amount to BTC
  useEffect(() => {
    if (exchangeRate && amount && !isNaN(parseFloat(amount))) {
      const btcValue = parseFloat(amount) / exchangeRate;
      setBtcAmount(btcValue.toFixed(8));
    }
  }, [amount, exchangeRate]);

  const handleDonate = async () => {
    if (!walletConnected) {
      // Connect wallet logic would go here
      // For demo purposes, we'll simulate a connection
      setWalletConnected(true);
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, this would trigger the wallet to send the transaction
      // For demo, we'll simulate a successful transaction
      setTimeout(() => {
        const mockTxId = `txid_${Math.random().toString(36).substring(2, 15)}`;
        onDonationSuccess?.(mockTxId, parseFloat(amount), currency);
        setIsLoading(false);
        setAmount('0.00');
      }, 2000);
    } catch (error) {
      console.error('Donation failed:', error);
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bitcoinAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className={cn('border rounded-lg p-6 bg-white shadow-sm', className)}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-semibold">Support Us with Bitcoin</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Donation Amount</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="flex-1"
              />
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exchangeRate && (
              <p className="text-sm text-gray-500">
                ≈ {btcAmount} BTC
                {currency !== 'BTC' && (
                  <span className="ml-2">(@ {exchangeRate.toLocaleString()} {currency}/BTC)</span>
                )}
              </p>
            )}
          </div>

          <Button
            onClick={handleDonate}
            disabled={parseFloat(amount) <= 0 || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Icons.Spinner className="h-4 w-4 animate-spin mr-2" />
            ) : walletConnected ? (
              <Icons.Bitcoin className="h-4 w-4 mr-2" />
            ) : (
              <Icons.Wallet className="h-4 w-4 mr-2" />
            )}
            {walletConnected ? `Donate ${btcAmount} BTC` : 'Connect Wallet'}
          </Button>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Or send manually to:</h4>
            <div className="flex items-center gap-2">
              <Input
                value={bitcoinAddress}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? <Icons.Check className="h-4 w-4" /> : <Icons.Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="p-4 bg-white rounded">
            <QRCode
              value={`bitcoin:${bitcoinAddress}?amount=${btcAmount}`}
              size={128}
              level="H"
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Scan this QR code with your Bitcoin wallet to donate
          </p>
          {exchangeRate && (
            <div className="text-xs text-gray-400 text-center">
              <p>1 BTC = {exchangeRate.toLocaleString()} {currency}</p>
              <p>Updated: {new Date().toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Icons.Info className="h-4 w-4" />
          <p>Donations are processed securely via the Bitcoin network</p>
        </div>
      </div>
    </div>
  );
};

export default BitcoinDonation;