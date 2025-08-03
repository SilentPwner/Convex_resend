// components/email-templates/WeeklyReport.tsx
import * as React from "react";

interface WeeklyReportProps {
  userName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  emotionAnalysis: {
    score: number;
    summary: string;
    dominantEmotion: string;
    keywords: string[];
    recommendations: string[];
  };
  weeklyStats: {
    emailCount: number;
    positiveEmails: number;
    negativeEmails: number;
    productAlerts: number;
    donations: number;
  };
  expertAdvice: string[];
  language: "en" | "ar";
  unsubscribeUrl: string;
}

export const weeklyReportEmail = ({
  userName,
  weekNumber,
  startDate,
  endDate,
  emotionAnalysis,
  weeklyStats,
  expertAdvice,
  language,
  unsubscribeUrl
}: WeeklyReportProps) => (
  <html dir={language === "ar" ? "rtl" : "ltr"}>
    <body style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: '#4CAF50', textAlign: 'center' }}>
        {language === "ar" 
          ? `تقرير الصحة العقلية - الأسبوع ${weekNumber}` 
          : `Mental Health Report - Week ${weekNumber}`}
      </h1>
      
      <div style={{ 
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          {language === "ar" ? "نظرة عامة" : "Overview"}
        </h2>
        <p>
          {language === "ar" 
            ? `الفترة من ${startDate} إلى ${endDate}` 
            : `Period: ${startDate} to ${endDate}`}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {weeklyStats.emailCount}
            </div>
            <div>
              {language === "ar" ? "إيميلات" : "Emails"}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {weeklyStats.positiveEmails}
            </div>
            <div>
              {language === "ar" ? "إيجابية" : "Positive"}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {weeklyStats.negativeEmails}
            </div>
            <div>
              {language === "ar" ? "سلبية" : "Negative"}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          {language === "ar" ? "تحليل المشاعر" : "Emotion Analysis"}
        </h2>
        <p>{emotionAnalysis.summary}</p>
        
        <div style={{ 
          margin: '15px 0',
          padding: '15px',
          backgroundColor: getEmotionColor(emotionAnalysis.score),
          borderRadius: '4px',
          color: 'white'
        }}>
          {language === "ar" 
            ? `الحالة الشعورية الغالبة: ${translateEmotion(emotionAnalysis.dominantEmotion, language)}` 
            : `Dominant Emotion: ${emotionAnalysis.dominantEmotion}`}
        </div>
        
        <div style={{ margin: '15px 0' }}>
          <h3>{language === "ar" ? "الكلمات المفتاحية" : "Key Keywords"}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {emotionAnalysis.keywords.map((word, i) => (
              <span key={i} style={{
                backgroundColor: '#e0e0e0',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '14px'
              }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          {language === "ar" ? "نصائح الخبراء" : "Expert Advice"}
        </h2>
        <ul style={{ paddingLeft: language === "ar" ? '0' : '20px' }}>
          {expertAdvice.map((advice, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{advice}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ 
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f0f7ff',
        borderRadius: '8px',
        borderLeft: '4px solid #4CAF50'
      }}>
        <h3>{language === "ar" ? "الخطوات التالية" : "Next Steps"}</h3>
        <p>
          {language === "ar" 
            ? "استمع إلى التقرير الصوتي المرفق للحصول على تحليل مفصل" 
            : "Listen to the attached audio report for detailed analysis"}
        </p>
        <p>
          {language === "ar" 
            ? "للحصول على دعم إضافي، يمكنك التحدث مع خبير" 
            : "For additional support, you can chat with an expert"}
        </p>
      </div>
      
      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <a href={unsubscribeUrl}>
          {language === "ar" 
            ? "إلغاء الاشتراك في التقارير الأسبوعية" 
            : "Unsubscribe from weekly reports"}
        </a>
      </div>
      
      <img 
        src={`https://api.lifesync.ai/track?report_id=${generateReportId()}`} 
        width="1" height="1" alt=""
      />
    </body>
  </html>
);

// دالة مساعدة لتحديد لون المشاعر
function getEmotionColor(score: number): string {
  if (score < 0.3) return '#f44336'; // أحمر
  if (score < 0.6) return '#ff9800'; // برتقالي
  return '#4CAF50'; // أخضر
}

// دالة لترجمة المشاعر للعربية
function translateEmotion(emotion: string, language: string): string {
  if (language !== "ar") return emotion;
  
  const translations: Record<string, string> = {
    happy: "سعيد",
    sad: "حزين",
    angry: "غاضب",
    anxious: "قلق",
    neutral: "محايد"
  };
  
  return translations[emotion.toLowerCase()] || emotion;
}