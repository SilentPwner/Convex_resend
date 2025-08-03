// components/email-templates/DonationReceipt.tsx
import * as React from "react";

interface DonationReceiptProps {
  userName: string;
  amount: number;
  currency: string;
  projectName: string;
  donationDate: string;
  isCrypto: boolean;
  transactionHash?: string;
  impactDescription: string;
  language: "en" | "ar";
  projectImages: string[];
  taxDeductible: boolean;
  nextSteps: string[];
}

export const donationReceiptEmail = ({
  userName,
  amount,
  currency,
  projectName,
  donationDate,
  isCrypto,
  transactionHash,
  impactDescription,
  language,
  projectImages,
  taxDeductible,
  nextSteps
}: DonationReceiptProps) => (
  <html dir={language === "ar" ? "rtl" : "ltr"}>
    <body style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#4CAF50' }}>
        {language === "ar" ? "شكراً لتبرعك الكريم" : "Thank You for Your Donation"}
      </h1>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
        <h2>{projectName}</h2>
        <p>{impactDescription}</p>
        
        {projectImages.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
            {projectImages.map(img => (
              <img 
                key={img} 
                src={img} 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                alt={projectName}
              />
            ))}
          </div>
        )}
        
        <div style={{ margin: '20px 0' }}>
          <h3>{language === "ar" ? "تفاصيل التبرع" : "Donation Details"}</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td>{language === "ar" ? "المبلغ" : "Amount"}:</td>
                <td style={{ textAlign: language === "ar" ? 'left' : 'right' }}>
                  {formatCurrency(amount, currency, language)}
                </td>
              </tr>
              <tr>
                <td>{language === "ar" ? "التاريخ" : "Date"}:</td>
                <td style={{ textAlign: language === "ar" ? 'left' : 'right' }}>{donationDate}</td>
              </tr>
              {isCrypto && transactionHash && (
                <tr>
                  <td>{language === "ar" ? "رقم المعاملة" : "Transaction Hash"}:</td>
                  <td style={{ textAlign: language === "ar" ? 'left' : 'right' }}>
                    <a href={`https://blockchain.com/btc/tx/${transactionHash}`}>
                      {transactionHash.slice(0, 8)}...{transactionHash.slice(-8)}
                    </a>
                  </td>
                </tr>
              )}
              {taxDeductible && (
                <tr>
                  <td colSpan={2} style={{ color: '#4CAF50', paddingTop: '10px' }}>
                    {language === "ar" 
                      ? "هذا التبرع معفي ضريبي" 
                      : "This donation is tax deductible"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {nextSteps.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3>{language === "ar" ? "الخطوات التالية" : "Next Steps"}</h3>
            <ul style={{ paddingLeft: language === "ar" ? '0' : '20px' }}>
              {nextSteps.map((step, i) => (
                <li key={i} style={{ marginBottom: '10px' }}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <img 
        src={`https://api.lifesync.ai/track?donation_id=${generateDonationId()}`} 
        width="1" height="1" alt=""
      />
    </body>
  </html>
);

// دالة مساعدة لتنسيق العملة
function formatCurrency(amount: number, currency: string, language: string): string {
  if (currency === "BTC") {
    return `${amount} BTC`;
  }
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    style: 'currency',
    currency: currency === "USD" ? "USD" : "EGP"
  }).format(amount);
}