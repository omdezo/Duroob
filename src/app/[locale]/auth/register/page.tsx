'use client';

import { use, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = use(params);
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isRTL ? 'فشل التسجيل' : 'Registration failed'));
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but auto-login failed, redirect to sign in
        router.push(`/${locale}/auth/signin`);
      } else {
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch {
      setError(isRTL ? 'حدث خطأ ما' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🇴🇲</div>
          <h1 className="text-3xl font-bold text-teal-700">
            {isRTL ? 'دُروب' : 'Duroob'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isRTL ? 'أنشئ حسابك الجديد' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-100">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'الاسم' : 'Name'}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={isRTL ? '6 أحرف على الأقل' : 'At least 6 characters'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirm your password'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (isRTL ? 'جارٍ إنشاء الحساب...' : 'Creating account...')
                : (isRTL ? 'إنشاء حساب' : 'Create Account')
              }
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link
              href={`/${locale}/auth/signin`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              {isRTL ? 'سجّل الدخول' : 'Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
