import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui/icons';

const adminMenu = [
  { name: 'لوحة التحكم', path: '/admin/dashboard', icon: <Icons.LayoutDashboard /> },
  { name: 'المستخدمين', path: '/admin/users', icon: <Icons.Users /> },
  { name: 'التبرعات', path: '/admin/donations', icon: <Icons.HandCoins /> },
  { name: 'الإعدادات', path: '/admin/settings', icon: <Icons.Settings /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-card border-r shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icons.ShieldCheck className="text-primary" />
          لوحة المشرفين
        </h2>
      </div>
      
      <nav className="p-2">
        {adminMenu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
              pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}