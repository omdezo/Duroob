'use client';

import { use, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default function SignInPage({ params }: SignInPageProps) {
  const { locale } = use(params);
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      } else {
        // Check if user is admin and redirect accordingly
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user?.role === 'admin') {
          router.push(`/${locale}/admin`);
        } else {
          router.push(`/${locale}`);
        }
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
            {isRTL ? 'سجّل الدخول إلى حسابك' : 'Sign in to your account'}
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
                placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
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
                ? (isRTL ? 'جارٍ تسجيل الدخول...' : 'Signing in...')
                : (isRTL ? 'تسجيل الدخول' : 'Sign In')
              }
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link
              href={`/${locale}/auth/register`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              {isRTL ? 'سجّل الآن' : 'Register'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
