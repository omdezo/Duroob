'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Users, Shield, User as UserIcon, Mail, Calendar } from 'lucide-react';

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={isRtl ? 'text-right' : ''}>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? `${users.length} مستخدم مسجل` : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <Users size={28} className="text-gray-400 mb-4" />
          <p className="text-gray-500">{isRtl ? 'لا يوجد مستخدمين مسجلين بعد' : 'No registered users yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <div key={user.id} className={`px-5 py-4 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  user.role === 'admin'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail size={10} />
                    {user.email}
                  </p>
                </div>

                {/* Role badge */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Shield size={10} className="inline me-1" />
                  {user.role === 'admin' ? (isRtl ? 'مشرف' : 'Admin') : (isRtl ? 'مستخدم' : 'User')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`bg-blue-50 rounded-xl p-4 ${isRtl ? 'text-right' : ''}`}>
        <p className="text-sm text-blue-700">
          {isRtl
            ? '💡 للتجربة: سجل دخول كمشرف بـ admin@duroob.om / admin123 أو أنشئ حسابات جديدة من صفحة التسجيل.'
            : '💡 To test: Sign in as admin with admin@duroob.om / admin123 or create new accounts from the register page.'}
        </p>
      </div>
    </div>
  );
}
