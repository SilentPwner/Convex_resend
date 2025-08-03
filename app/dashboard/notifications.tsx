'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function Notifications() {
  const alerts = useQuery(api.priceAlerts.list, { userId: currentUser._id });
  const toneReports = useQuery(api.emailAnalysis.recent, { userId: currentUser._id });

  return (
    <div className="space-y-4">
      <h2>تنبيهات الأسعار</h2>
      {alerts?.map(alert => (
        <PriceAlertCard key={alert._id} alert={alert} />
      ))}
      
      <h2>تقارير النبرة</h2>
      {toneReports?.map(report => (
        <ToneReportCard key={report._id} report={report} />
      ))}
    </div>
  );
}