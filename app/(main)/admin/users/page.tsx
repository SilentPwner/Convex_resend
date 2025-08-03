// app/(main)/admin/users/page.tsx
import { getUsers } from "@/convex/users";
import { updateUserRole } from "@/convex/users";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function AdminUsersPage() {
  const users = await convex.query(getUsers);
  const currentUser = await convex.query(getCurrentUser);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">غير مصرح بالوصول</h1>
        <p className="mt-4">ليست لديك الصلاحيات اللازمة لعرض هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">إدارة المستخدمين</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b">الاسم</th>
              <th className="py-3 px-4 border-b">البريد الإلكتروني</th>
              <th className="py-3 px-4 border-b">الدور</th>
              <th className="py-3 px-4 border-b">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id.toString()}>
                <td className="py-3 px-4 border-b">{user.name || "بدون اسم"}</td>
                <td className="py-3 px-4 border-b">{user.email}</td>
                <td className="py-3 px-4 border-b">
                  <select
                    defaultValue={user.role}
                    onChange={async (e) => {
                      "use server";
                      await convex.mutation(updateUserRole, {
                        userId: user._id,
                        newRole: e.target.value as any,
                      });
                    }}
                    className="bg-gray-100 rounded px-2 py-1"
                  >
                    <option value="user">مستخدم</option>
                    <option value="moderator">مشرف</option>
                    <option value="admin">مدير</option>
                  </select>
                </td>
                <td className="py-3 px-4 border-b">
                  <button className="text-red-500 hover:text-red-700">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}