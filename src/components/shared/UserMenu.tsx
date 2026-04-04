'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Settings, Heart, LayoutDashboard, User, Map } from 'lucide-react';

interface UserMenuProps {
  locale: string;
}

export default function UserMenu({ locale }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isRTL = locale === 'ar';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  // Not authenticated — show sign in button
  if (!session?.user) {
    return (
      <Link
        href={`/${locale}/auth/signin`}
        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <User size={16} />
        <span>{isRTL ? 'دخول' : 'Sign In'}</span>
      </Link>
    );
  }

  // Authenticated
  const user = session.user;
  const initials = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();
  const isAdmin = user.role === 'admin';

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        aria-label={isRTL ? 'قائمة المستخدم' : 'User menu'}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? ''}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute top-12 ${isRTL ? 'left-0' : 'right-0'} w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50`}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate" dir="ltr">{user.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                <LayoutDashboard size={16} />
                <span>{isRTL ? 'لوحة التحكم' : 'Dashboard'}</span>
              </Link>
            )}

            <Link
              href={`/${locale}/saved`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
            >
              <Heart size={16} />
              <span>{isRTL ? 'الوجهات المحفوظة' : 'Saved Destinations'}</span>
            </Link>

            <Link
              href={`/${locale}/trips`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
            >
              <Map size={16} />
              <span>{isRTL ? 'رحلاتي' : 'My Trips'}</span>
            </Link>

            <Link
              href={`/${locale}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
            >
              <Settings size={16} />
              <span>{isRTL ? 'الملف الشخصي' : 'Profile'}</span>
            </Link>
          </div>

          {/* Divider + Sign out */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: `/${locale}` });
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut size={16} />
              <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
