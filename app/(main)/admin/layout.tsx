import { AdminSidebar } from '@/components/admin/Sidebar';
import { checkAdminRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await checkAdminRole();
  
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 ml-64">
        {children}
      </div>
    </div>
  );
}