'use client';
import { Card, Metric, Title } from '@tremor/react';

export default function AdminDashboard({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <Title>إجمالي الإيميلات</Title>
        <Metric>{metrics.emailStats.total}</Metric>
      </Card>
      <Card>
        <Title>إيميلات إيجابية</Title>
        <Metric>{metrics.emailStats.positive}</Metric>
      </Card>
      <Card>
        <Title>إيميلات سلبية</Title>
        <Metric>{metrics.emailStats.negative}</Metric>
      </Card>
      <Card className="col-span-3">
        <Title>إحصائيات التبرعات</Title>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm">إجمالي التبرعات</p>
            <Metric>{metrics.donationStats.total}</Metric>
          </div>
          <div>
            <p className="text-sm">تبرعات بالبتكوين</p>
            <Metric>{metrics.donationStats.bitcoin}</Metric>
          </div>
        </div>
      </Card>
    </div>
  );
}