'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Shield, Mail, Trash2, Loader2 } from 'lucide-react';

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
  const { data: session } = useSession();
  const currentEmail = session?.user?.email;

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(userId: string, userName: string) {
    const confirmed = window.confirm(
      isRtl
        ? `هل أنت متأكد من حذف المستخدم "${userName}"؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to delete "${userName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

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
            {users.map((user) => {
              const isSelf = user.email === currentEmail;
              const isUpdating = updatingId === user.id;

              return (
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
                    <p className="font-medium text-gray-900 text-sm">
                      {user.name}
                      {isSelf && (
                        <span className="text-xs text-gray-400 ml-2">
                          {isRtl ? '(أنت)' : '(you)'}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail size={10} />
                      {user.email}
                    </p>
                  </div>

                  {/* Role select */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isUpdating || isSelf}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      user.role === 'admin'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    } ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
                  >
                    <option value="user">{isRtl ? 'مستخدم' : 'User'}</option>
                    <option value="admin">{isRtl ? 'مشرف' : 'Admin'}</option>
                  </select>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={isUpdating || isSelf}
                    title={isSelf ? (isRtl ? 'لا يمكنك حذف نفسك' : 'Cannot delete yourself') : (isRtl ? 'حذف المستخدم' : 'Delete user')}
                    className={`p-2 rounded-lg transition-colors ${
                      isSelf
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
