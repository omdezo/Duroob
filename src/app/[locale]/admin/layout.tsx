'use client';

import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart3,
  MapPin,
  Users,
  Map,
  MessageCircle,
  Settings,
  Shield,
  ArrowLeft,
  Menu,
  X,
  Loader2,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: 'overview', icon: BarChart3, labelEn: 'Overview', labelAr: 'نظرة عامة' },
  { href: 'destinations', icon: MapPin, labelEn: 'Destinations', labelAr: 'الوجهات' },
  { href: 'users', icon: Users, labelEn: 'Users', labelAr: 'المستخدمون' },
  { href: 'trips', icon: Map, labelEn: 'Trips', labelAr: 'الرحلات' },
  { href: 'chat', icon: MessageCircle, labelEn: 'Chat Log', labelAr: 'سجل المحادثات' },
  { href: 'settings', icon: Settings, labelEn: 'Settings', labelAr: 'الإعدادات' },
  { href: 'audit-log', icon: Shield, labelEn: 'Audit Log', labelAr: 'سجل المراجعة' },
];

const SIDEBAR_ID = 'admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const { data: session, status } = useSession();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = `/${locale}/admin`;

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={28} className="text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isRtl ? 'تحتاج لتسجيل الدخول' : 'You need to sign in'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isRtl ? 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم.' : 'Please sign in to access the admin panel.'}
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <LogIn size={16} />
            {isRtl ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </div>
      </div>
    );
  }

  // Not admin
  if (session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isRtl ? 'الوصول مرفوض' : 'Access Denied'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isRtl ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم.' : 'You do not have permission to access the admin panel.'}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {isRtl ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex ${isRtl ? 'flex-row-reverse' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id={SIDEBAR_ID}
        aria-label={isRtl ? 'التنقل في لوحة التحكم' : 'Admin navigation'}
        className={`
          fixed top-0 ${isRtl ? 'right-0' : 'left-0'} z-50 h-full w-[240px] bg-white border-gray-200 flex flex-col
          ${isRtl ? 'border-l' : 'border-r'}
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <span className="text-lg font-bold text-teal-700 tracking-tight">
            {isRtl ? 'لوحة دروب' : 'Duroob Admin'}
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
            aria-label={isRtl ? 'إغلاق القائمة الجانبية' : 'Close sidebar'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const fullHref = `${basePath}/${item.href}`;
            const isActive = pathname.includes(`/admin/${item.href}`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={fullHref}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isRtl ? 'flex-row-reverse text-right' : ''}
                  ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-teal-600' : 'text-gray-400'} aria-hidden="true" />
                <span>{isRtl ? item.labelAr : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="p-3 border-t border-gray-100">
          <Link
            href={`/${locale}`}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors
              ${isRtl ? 'flex-row-reverse text-right' : ''}
            `}
          >
            <ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} aria-hidden="true" />
            <span>{isRtl ? 'العودة للتطبيق' : 'Back to App'}</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
            aria-label={isRtl ? 'فتح القائمة الجانبية' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls={SIDEBAR_ID}
          >
            <Menu size={22} />
          </button>
          <span className={`text-sm font-bold text-teal-700 ${isRtl ? 'mr-3' : 'ml-3'}`}>
            {isRtl ? 'لوحة دروب' : 'Duroob Admin'}
          </span>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
