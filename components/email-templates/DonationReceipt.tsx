// components/email-templates/DonationReceipt.tsx
import * as React from 'react';

interface DonationReceiptProps {
  donorName: string;
  amount: number;
  currency: string;
  donationDate: string;
  transactionId: string;
  campaignName?: string;
  isRecurring?: boolean;
  language?: 'en' | 'ar';
  organizationName: string;
  contactEmail: string;
}

export const DonationReceiptEmail: React.FC<DonationReceiptProps> = ({
  donorName,
  amount,
  currency,
  donationDate,
  transactionId,
  campaignName,
  isRecurring = false,
  language = 'en',
  organizationName,
  contactEmail,
}) => {
  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'text-right' : 'text-left';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div dir={dir} className="font-sans bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            {isRTL ? 'إيصال تبرع' : 'Donation Receipt'}
          </h1>
          <p className="text-green-100 mt-2">
            {isRTL ? 'شكراً لك على تبرعك الكريم' : 'Thank you for your generous donation'}
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className={`mb-8 ${textAlign}`}>
            <h2 className="text-xl font-semibold mb-4">
              {isRTL ? 'عزيزي/عزيزتي' : 'Dear'} {donorName},
            </h2>
            <p className="text-gray-700 mb-4">
              {isRTL
                ? 'نشكرك على تبرعك السخي الذي سيساهم في دعم رسالتنا. نقدم لك التفاصيل التالية كإيصال رسمي لتبرعك:'
                : 'We thank you for your generous donation that will help support our mission. Below are the details of your donation as an official receipt:'}
            </p>
          </div>

          {/* Donation Details */}
          <div className={`border border-gray-200 rounded-lg p-6 mb-6 ${textAlign}`}>
            <h3 className="font-medium text-lg mb-4">
              {isRTL ? 'تفاصيل التبرع' : 'Donation Details'}
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isRTL ? 'المبلغ' : 'Amount'}:
                </span>
                <span className="font-medium">
                  {formatCurrency(amount)}
                </span>
              </div>

              {campaignName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {isRTL ? 'الحملة' : 'Campaign'}:
                  </span>
                  <span className="font-medium">{campaignName}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isRTL ? 'تاريخ التبرع' : 'Donation Date'}:
                </span>
                <span className="font-medium">{formatDate(donationDate)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isRTL ? 'رقم المعاملة' : 'Transaction ID'}:
                </span>
                <span className="font-medium">{transactionId}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isRTL ? 'نوع التبرع' : 'Donation Type'}:
                </span>
                <span className="font-medium">
                  {isRecurring 
                    ? (isRTL ? 'متكرر' : 'Recurring') 
                    : (isRTL ? 'مرة واحدة' : 'One-time')}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Deductible Section */}
          <div className={`bg-blue-50 p-4 rounded-lg mb-6 ${textAlign}`}>
            <h4 className="font-medium text-blue-800 mb-2">
              {isRTL ? 'ملاحظات ضريبية' : 'Tax Information'}
            </h4>
            <p className="text-blue-700 text-sm">
              {isRTL
                ? `${organizationName} هي منظمة معفاة من الضرائب بموجب المادة 501(c)(3). تبرعاتك قابلة للخصم الضريبي بالكامل ضمن الحدود التي يسمح بها القانون.`
                : `${organizationName} is a tax-exempt organization under Section 501(c)(3). Your donation is fully tax-deductible to the extent allowed by law.`}
            </p>
          </div>

          {/* Contact Info */}
          <div className={`${textAlign}`}>
            <p className="text-gray-700 mb-2">
              {isRTL
                ? 'إذا كانت لديك أي أسئلة حول تبرعك، فلا تتردد في التواصل معنا على:'
                : 'If you have any questions about your donation, please contact us at:'}
            </p>
            <a 
              href={`mailto:${contactEmail}`} 
              className="text-green-600 hover:underline"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-gray-50 p-6 text-sm text-gray-600 ${textAlign}`}>
          <div className="mb-4">
            <p className="font-medium">{organizationName}</p>
            <p>
              {isRTL
                ? 'نحن نقدر دعمك ونعدك باستخدام تبرعك بحكمة لتحقيق رسالتنا.'
                : 'We appreciate your support and promise to use your donation wisely to further our mission.'}
            </p>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p>
              © {new Date().getFullYear()} {organizationName}.{' '}
              {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as default for Resend compatibility
export default DonationReceiptEmail;