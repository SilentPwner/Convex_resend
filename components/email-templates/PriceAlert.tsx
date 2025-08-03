// components/email-templates/PriceAlert.tsx
import * as React from "react";

interface PriceAlertProps {
  productName: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  productUrl: string;
  imageUrl?: string;
  language: "en" | "ar";
  unsubscribeUrl: string;
}

export const priceAlertEmail = ({
  productName,
  oldPrice,
  newPrice,
  discount,
  productUrl,
  imageUrl,
  language,
  unsubscribeUrl
}: PriceAlertProps) => (
  <html dir={language === "ar" ? "rtl" : "ltr"}>
    <body style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={productName}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        )}
        
        <h1 style={{ color: '#4CAF50' }}>
          {language === "ar" 
            ? `🚨 انخفاض السعر بنسبة ${discount}%!` 
            : `🚨 Price dropped ${discount}%!`}
        </h1>
        
        <h2>{productName}</h2>
        
        <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
          <div style={{ textDecoration: 'line-through' }}>
            {formatCurrency(oldPrice, language)}
          </div>
          <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            {formatCurrency(newPrice, language)}
          </div>
        </div>
        
        <a 
          href={productUrl}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block',
            margin: '20px 0'
          }}
        >
          {language === "ar" ? "اشتري الآن" : "Buy Now"}
        </a>
        
        <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
          <a href={unsubscribeUrl}>
            {language === "ar" 
              ? "إلغاء الاشتراك في التنبيهات" 
              : "Unsubscribe from alerts"}
          </a>
        </div>
        
        <img 
          src={`https://api.lifesync.ai/track?alert_id=${generateAlertId()}`} 
          width="1" height="1" alt=""
        />
      </div>
    </body>
  </html>
);

// دالة مساعدة لتنسيق العملة
function formatCurrency(amount: number, language: string): string {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    style: 'currency',
    currency: language === "ar" ? "EGP" : "USD"
  }).format(amount);
}