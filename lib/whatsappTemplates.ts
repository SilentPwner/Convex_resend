// lib/whatsappTemplates.ts
interface TemplateData {
  [key: string]: any;
}

export async function getMessageContent(
  type: string,
  data: TemplateData,
  language: string = "en"
): Promise<{ message: string; media?: { url: string; asDocument: boolean } }> {
  switch (type) {
    case "price_alert":
      return {
        message: language === "ar"
          ? `تنبيه سعر: انخفض سعر ${data.productName} بنسبة ${data.discount}%\n` +
            `السعر القديم: ${formatCurrency(data.oldPrice, 'USD', language)}\n` +
            `السعر الجديد: ${formatCurrency(data.newPrice, 'USD', language)}\n` +
            `رابط المنتج: ${data.productUrl}`
          : `Price Alert: ${data.productName} dropped by ${data.discount}%\n` +
            `Old Price: ${formatCurrency(data.oldPrice, 'USD', language)}\n` +
            `New Price: ${formatCurrency(data.newPrice, 'USD', language)}\n` +
            `Product URL: ${data.productUrl}`,
        media: data.imageUrl 
          ? { url: data.imageUrl, asDocument: false } 
          : undefined
      };

    case "donation_confirmation":
      return {
        message: language === "ar"
          ? `شكراً لتبرعك! 🎉\n` +
            `المبلغ: ${formatCurrency(data.amount, data.currency, language)}\n` +
            `المشروع: ${data.projectName}\n` +
            `${data.currency === 'BTC' ? `رقم المعاملة: ${data.transactionHash}\n` : ''}` +
            `التأثير: ${data.impact}`
          : `Thank you for your donation! 🎉\n` +
            `Amount: ${formatCurrency(data.amount, data.currency, language)}\n` +
            `Project: ${data.projectName}\n` +
            `${data.currency === 'BTC' ? `Transaction Hash: ${data.transactionHash}\n` : ''}` +
            `Impact: ${data.impact}`,
        media: { 
          url: 'https://lifesync.ai/images/donation-thankyou.jpg',
          asDocument: true
        }
      };

    case "mental_health_alert":
      return {
        message: language === "ar"
          ? `نلاحظ أن بعض رسائلك الأخيرة تبدو سلبية. نحن هنا لمساعدتك!\n` +
            `يمكنك التحدث مع خبير: ${process.env.BASE_URL}/mental-health/support`
          : `We noticed some of your recent messages seem negative. We're here to help!\n` +
            `Chat with an expert: ${process.env.BASE_URL}/mental-health/support`
      };

    case "weekly_report":
      return {
        message: language === "ar"
          ? `تقريرك الأسبوعي جاهز! 📊\n` +
            `تحقق من بريدك الإلكتروني للحصول على التقرير الكامل أو استمع إلى الملخص الصوتي المرفق.`
          : `Your weekly report is ready! 📊\n` +
            `Check your email for the full report or listen to the attached audio summary.`,
        media: {
          url: `${process.env.BASE_URL}/api/generate-weekly-qr?userId=${data.userId}`,
          asDocument: false
        }
      };

    default:
      throw new Error("Unknown notification type");
  }
}

function formatCurrency(amount: number, currency: string, language: string): string {
  if (currency === 'BTC') return `${amount} BTC`;
  
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'EGP'
  }).format(amount);
}