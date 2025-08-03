export default function Unauthorized() {
  return (
    <div className="text-center p-10">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - غير مصرح</h1>
      <p>ليس لديك صلاحية الوصول إلى هذه الصفحة</p>
    </div>
  );
}