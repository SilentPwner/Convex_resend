import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';

export function AdminStats() {
  const stats = useQuery(api.admin.getDashboardStats);
  
  if (!stats) return <div>جاري التحميل...</div>;
  
  const statCards = [
    { 
      title: 'إجمالي المستخدمين', 
      value: stats.totalUsers, 
      icon: <Icons.Users className="h-6 w-6" />,
      change: stats.userGrowth 
    },
    { 
      title: 'إجمالي التبرعات', 
      value: `$${stats.totalDonations.toFixed(2)}`, 
      icon: <Icons.HandCoins className="h-6 w-6" />,
      change: stats.donationGrowth 
    },
    { 
      title: 'المعاملات النشطة', 
      value: stats.activeTransactions, 
      icon: <Icons.Activity className="h-6 w-6" />,
      change: stats.transactionGrowth 
    },
    { 
      title: 'معدل التحويل', 
      value: `${stats.conversionRate}%`, 
      icon: <Icons.BarChart className="h-6 w-6" />,
      change: stats.conversionChange 
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs mt-1 ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}% عن الشهر الماضي
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}