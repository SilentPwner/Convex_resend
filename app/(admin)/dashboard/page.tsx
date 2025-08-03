import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getAdminMetrics } from '@/convex/admin';
import AdminDashboard from '@/components/admin/Dashboard';

export default async function AdminPage() {
  const { userId } = auth();
  
  // التحقق من صلاحيات الأدمن
  const isAdmin = await checkAdminRole(userId);
  if (!isAdmin) redirect('/');

  // جلب البيانات
  const metrics = await getAdminMetrics();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم الإدارية</h1>
      <AdminDashboard metrics={metrics} />
    </div>
  );
}

async function checkAdminRole(userId: string) {
  // تنفيذ الاستعلام في Convex
  const user = await query(api.users.get, { userId });
  return user?.role === 'admin';
}