// app/(main)/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth/admin";

export default async function Dashboard() {
  const user = await getCurrentUser();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          {user?.imageUrl && (
            <img 
              src={user.imageUrl} 
              alt="صورة المستخدم" 
              className="w-16 h-16 rounded-full mr-4"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">
              مرحباً، {user?.name || "مستخدم"}
            </h2>
            <p className="text-gray-600">
              {user?.email} | دورك: {user?.role}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">إحصائيات المستخدمين</h3>
            <p className="text-2xl mt-2">1,248</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">النشاط اليومي</h3>
            <p className="text-2xl mt-2">64</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">المهام المكتملة</h3>
            <p className="text-2xl mt-2">89%</p>
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="mt-8">
            <a 
              href="/admin/users" 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              الانتقال إلى إدارة المستخدمين
            </a>
          </div>
        )}
      </div>
    </div>
  );
}