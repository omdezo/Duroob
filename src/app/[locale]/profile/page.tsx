'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import {
  User, Mail, Shield, CalendarDays, Save,
  Loader2, Check, AlertCircle, Lock, Eye, EyeOff,
} from 'lucide-react';

export default function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const ar = locale === 'ar';
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile(data.user);
        setName(data.user.name ?? '');
      } catch {
        setToast({ type: 'error', msg: ar ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    }
    if (status !== 'loading' && session?.user) {
      fetchProfile();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [session, status, ar]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSaveName() {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setProfile(data.user);
      setToast({ type: 'success', msg: ar ? 'تم حفظ الاسم بنجاح' : 'Name updated successfully' });
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || (ar ? 'فشل التحديث' : 'Update failed') });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', msg: ar ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', msg: ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ type: 'success', msg: ar ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully' });
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || (ar ? 'فشل تغيير كلمة المرور' : 'Password change failed') });
    } finally {
      setChangingPassword(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString(ar ? 'ar-OM' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Not authenticated
  if (!loading && !session?.user) {
    return (
      <div dir={ar ? 'rtl' : 'ltr'} className="min-h-[calc(100dvh-64px)] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {ar ? 'يرجى تسجيل الدخول' : 'Please sign in'}
          </h2>
          <p className="text-gray-500 text-sm">
            {ar ? 'تحتاج لتسجيل الدخول لعرض ملفك الشخصي' : 'You need to sign in to view your profile'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-[calc(100dvh-64px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <User size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ar ? 'الملف الشخصي' : 'Profile'}
            </h1>
            <p className="text-sm text-gray-500">
              {ar ? 'إدارة حسابك ومعلوماتك' : 'Manage your account and info'}
            </p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                {ar ? 'معلومات الحساب' : 'Account Info'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{ar ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="text-sm text-gray-700" dir="ltr">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{ar ? 'الدور' : 'Role'}</p>
                    <p className="text-sm text-gray-700 capitalize">{profile.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{ar ? 'تاريخ الانضمام' : 'Joined'}</p>
                    <p className="text-sm text-gray-700">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Name */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                {ar ? 'تعديل الاسم' : 'Edit Name'}
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={ar ? 'الاسم الكامل' : 'Full name'}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none transition"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || !name.trim()}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition disabled:opacity-40 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {ar ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                {ar ? 'تغيير كلمة المرور' : 'Change Password'}
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder={ar ? 'كلمة المرور الحالية' : 'Current password'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none transition pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={ar ? 'كلمة المرور الجديدة' : 'New password'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none transition pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={ar ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:border-teal-400 focus:outline-none transition"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition disabled:opacity-40 flex items-center gap-2"
                >
                  {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  {ar ? 'تغيير كلمة المرور' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
