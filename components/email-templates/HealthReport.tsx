// components/email-templates/HealthReport.tsx
import * as React from 'react';

interface HealthReportProps {
  patientName: string;
  reportDate: string;
  reportType: string;
  doctorName: string;
  summary: string;
  vitalStats: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
  };
  recommendations?: string[];
  nextAppointment?: string;
  language?: 'en' | 'ar';
  clinicName: string;
  clinicContact: string;
  isUrgent?: boolean;
}

export const HealthReportEmail: React.FC<HealthReportProps> = ({
  patientName,
  reportDate,
  reportType,
  doctorName,
  summary,
  vitalStats,
  recommendations = [],
  nextAppointment,
  language = 'en',
  clinicName,
  clinicContact,
  isUrgent = false,
}) => {
  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'text-right' : 'text-left';

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
        <div className={`p-6 ${isUrgent ? 'bg-red-600' : 'bg-blue-600'} text-center`}>
          <h1 className="text-2xl font-bold text-white">
            {isRTL ? 'تقرير طبي' : 'Health Report'}
          </h1>
          <p className="text-white/90 mt-2">
            {isRTL ? 'من مركز الحياة المتوازنة' : 'From LifeSync Medical Center'}
          </p>
          {isUrgent && (
            <div className="mt-3 bg-white/20 inline-block px-4 py-1 rounded-full">
              <span className="font-medium text-white">
                {isRTL ? 'عاجل' : 'URGENT'}
              </span>
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className={`p-6 border-b ${textAlign}`}>
          <h2 className="text-xl font-semibold mb-4">
            {isRTL ? 'معلومات المريض' : 'Patient Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">{isRTL ? 'الاسم' : 'Name'}</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-gray-600">{isRTL ? 'تاريخ التقرير' : 'Report Date'}</p>
              <p className="font-medium">{formatDate(reportDate)}</p>
            </div>
            <div>
              <p className="text-gray-600">{isRTL ? 'نوع التقرير' : 'Report Type'}</p>
              <p className="font-medium">{reportType}</p>
            </div>
            <div>
              <p className="text-gray-600">{isRTL ? 'الطبيب المعالج' : 'Doctor'}</p>
              <p className="font-medium">{doctorName}</p>
            </div>
          </div>
        </div>

        {/* Vital Stats */}
        <div className={`p-6 border-b ${textAlign}`}>
          <h2 className="text-xl font-semibold mb-4">
            {isRTL ? 'المؤشرات الحيوية' : 'Vital Statistics'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                {isRTL ? 'ضغط الدم' : 'Blood Pressure'}
              </p>
              <p className="font-bold text-blue-900">{vitalStats.bloodPressure}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">
                {isRTL ? 'معدل ضربات القلب' : 'Heart Rate'}
              </p>
              <p className="font-bold text-green-900">
                {vitalStats.heartRate} {isRTL ? 'نبضة/د' : 'bpm'}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                {isRTL ? 'درجة الحرارة' : 'Temperature'}
              </p>
              <p className="font-bold text-yellow-900">
                {vitalStats.temperature}°{language === 'ar' ? 'م' : 'C'}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm">
                {isRTL ? 'تشبع الأكسجين' : 'Oxygen Level'}
              </p>
              <p className="font-bold text-purple-900">
                {vitalStats.oxygenLevel}%
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={`p-6 border-b ${textAlign}`}>
          <h2 className="text-xl font-semibold mb-4">
            {isRTL ? 'ملخص التقرير' : 'Report Summary'}
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">{summary}</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className={`p-6 border-b ${textAlign}`}>
            <h2 className="text-xl font-semibold mb-4">
              {isRTL ? 'التوصيات الطبية' : 'Medical Recommendations'}
            </h2>
            <ul className="space-y-2 pl-5 list-disc">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className={`p-6 ${textAlign}`}>
          <h2 className="text-xl font-semibold mb-4">
            {isRTL ? 'الخطوات التالية' : 'Next Steps'}
          </h2>
          {nextAppointment ? (
            <div className="mb-4">
              <p className="text-gray-600">
                {isRTL ? 'موعدك القادم' : 'Your Next Appointment'}:
              </p>
              <p className="font-medium">{formatDate(nextAppointment)}</p>
            </div>
          ) : (
            <p className="text-gray-700 mb-4">
              {isRTL
                ? 'لا يوجد موعد قادم محدد بعد. يرجى الاتصال بالعيادة لجدولة موعد متابعة إذا لزم الأمر.'
                : 'No upcoming appointment scheduled yet. Please contact the clinic to schedule a follow-up if needed.'}
            </p>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium mb-2">
              {isRTL ? 'للتواصل مع العيادة' : 'Clinic Contact Information'}:
            </p>
            <p>{clinicName}</p>
            <p>
              {isRTL ? 'هاتف' : 'Phone'}: {clinicContact}
            </p>
            {isUrgent && (
              <p className="text-red-600 font-medium mt-2">
                {isRTL
                  ? 'هذا التقرير يحتاج إلى متابعة عاجلة. يرجى الاتصال بالعيادة في أقرب وقت ممكن.'
                  : 'This report requires urgent follow-up. Please contact the clinic as soon as possible.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-gray-50 p-6 text-sm text-gray-600 ${textAlign}`}>
          <p className="mb-2">
            {isRTL
              ? 'هذا التقرير مخصص للاستخدام الطبي فقط ولا يعتبر تشخيصاً نهائياً.'
              : 'This report is for medical use only and should not be considered as a final diagnosis.'}
          </p>
          <div className="pt-4 border-t border-gray-200">
            <p>
              © {new Date().getFullYear()} {clinicName}.{' '}
              {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as default for Resend compatibility
export default HealthReportEmail;