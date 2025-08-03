// components/email-templates/PriceAlert.tsx
import * as React from 'react';

interface PriceAlertProps {
  productName: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  productUrl: string;
  imageUrl?: string;
  unsubscribeUrl: string;
  language?: string;
}

export const PriceAlertEmail: React.FC<PriceAlertProps> = ({
  productName,
  oldPrice,
  newPrice,
  discount,
  productUrl,
  imageUrl,
  unsubscribeUrl,
  language = 'en',
}) => {
  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div dir={dir} className="font-sans bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            {isRTL ? 'تنبيه انخفاض السعر' : 'Price Drop Alert'}
          </h1>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {imageUrl && (
              <div className="w-full md:w-1/3">
                <img
                  src={imageUrl}
                  alt={productName}
                  className="rounded-lg object-cover w-full h-auto"
                />
              </div>
            )}

            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-xl font-semibold mb-2">{productName}</h2>
              
              <div className="mb-4">
                <span className="text-gray-500 line-through mr-2">
                  {formatPrice(oldPrice)}
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatPrice(newPrice)}
                </span>
              </div>

              <div className="bg-green-100 text-green-800 inline-block px-3 py-1 rounded-full text-sm font-medium mb-4">
                {isRTL ? 
                  `وفر ${discount}%` : 
                  `Save ${discount}%`
                }
              </div>

              <p className="text-gray-700 mb-6">
                {isRTL ?
                  'انخفض سعر المنتج الذي تتابعه! استغل هذه الفرصة الآن.' :
                  'The price has dropped on the product you are tracking! Take advantage now.'
                }
              </p>

              <a
                href={productUrl}
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {isRTL ? 'عرض المنتج' : 'View Product'}
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-gray-50 p-6 text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="mb-2">
            {isRTL ?
              'لن تصلك هذه التنبيهات إذا قمت بإلغاء متابعة المنتج.' :
              'You will stop receiving these alerts if you unsubscribe from this product.'
            }
          </p>
          <a 
            href={unsubscribeUrl} 
            className="text-indigo-600 hover:underline"
          >
            {isRTL ? 'إلغاء المتابعة' : 'Unsubscribe'}
          </a>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p>
              {isRTL ?
                'هذه الرسالة مرسلة إليك لأنك قمت بمتابعة هذا المنتج على LifeSync.' :
                'You received this email because you are tracking this product on LifeSync.'
              }
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} LifeSync. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as default for Resend compatibility
export default PriceAlertEmail;