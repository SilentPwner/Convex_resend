// lifesync/app/(main)/settings/page.tsx

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  const { user } = useUser();
  const [emailPreferences, setEmailPreferences] = useState({
    alerts: true,
    reports: true,
    newsletters: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // جلب إعدادات المستخدم الحالية
  const userSettings = useQuery(api.queries.auth.getUserSettings, {
    userId: user?.id,
  });

  // طفرة لتحديث الإعدادات عبر Resend
  const updateSettings = useMutation(api.actions.resend.updatePreferences);

  // معالجة تغيير التفضيلات
  const handlePreferenceChange = async (key: keyof typeof emailPreferences) => {
    const newPreferences = {
      ...emailPreferences,
      [key]: !emailPreferences[key],
    };

    setEmailPreferences(newPreferences);
    setIsUpdating(true);

    try {
      // تحديث الإعدادات عبر Resend
      await updateSettings({
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress || '',
        preferences: newPreferences,
      });

      // إرسال تأكيد عبر Resend
      await useMutation(api.actions.resend.sendConfirmation)({
        userId: user?.id,
        emailType: 'preferences_update',
      });

      toast.success('تم تحديث التفضيلات بنجاح!');
    } catch (error) {
      toast.error('فشل في تحديث التفضيلات');
      console.error('Error updating preferences:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // اختبار إرسال بريد عبر Resend
  const handleTestEmail = async () => {
    try {
      await useMutation(api.actions.resend.testEmail)({
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress || '',
      });
      toast.success('تم إرسال البريد الاختباري بنجاح!');
    } catch (error) {
      toast.error('فشل في إرسال البريد الاختباري');
      console.error('Error sending test email:', error);
    }
  };

  if (!userSettings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">إعدادات البريد الإلكتروني</h1>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">تفضيلات الإشعارات</h2>
          
          <div className="space-y-4 mt-4">
            {Object.entries(emailPreferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="label cursor-pointer">
                  <span className="label-text capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handlePreferenceChange(key as any)}
                  className="toggle toggle-primary"
                  disabled={isUpdating}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">اختبار إعدادات البريد</h2>
          <p className="text-gray-600 mb-4">
            تأكد من وصول الرسائل إلى بريدك الإلكتروني
          </p>
          <button
            onClick={handleTestEmail}
            className="btn btn-primary"
            disabled={isUpdating}
          >
            {isUpdating ? 'جاري الإرسال...' : 'إرسال بريد اختباري'}
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">سجل النشاط</h2>
          <EmailActivityLog userId={user?.id} />
        </div>
      </div>
    </div>
  );
}

// مكون فرعي لعرض سجل النشاط
function EmailActivityLog({ userId }: { userId?: string }) {
  const emailLogs = useQuery(api.queries.resend.getEmailLogs, { userId });

  if (!emailLogs) return <div className="loading loading-spinner" />;

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>النوع</th>
            <th>التاريخ</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {emailLogs.map((log) => (
            <tr key={log._id}>
              <td>{log.type}</td>
              <td>{new Date(log._creationTime).toLocaleString()}</td>
              <td>
                <span className={`badge ${log.status === 'delivered' ? 'badge-success' : 'badge-error'}`}>
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}