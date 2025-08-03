import { AdminStats } from '@/components/admin/Stats';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { SystemHealth } from '@/components/admin/SystemHealth';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">لوحة تحكم المشرف</h1>
      
      <AdminStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities />
        <SystemHealth />
      </div>
    </div>
  );
}