'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Compass,
  MapPin,
  CalendarDays,
  MessageCircle,
  Heart,
  Globe,
  X,
  LogOut,
  User as UserIcon,
  Map,
} from 'lucide-react';

interface MobileDrawerProps {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ locale, isOpen, onClose }: MobileDrawerProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const isRtl = locale === 'ar';
  const altLocale = isRtl ? 'en' : 'ar';
  const altPath = pathname.replace(`/${locale}`, `/${altLocale}`);

  const links = [
    { href: `/${locale}`, label: t('home'), icon: <Compass size={20} /> },
    { href: `/${locale}/destinations`, label: t('destinations'), icon: <MapPin size={20} /> },
    { href: `/${locale}/planner`, label: t('planner'), icon: <CalendarDays size={20} /> },
    { href: `/${locale}/chat`, label: t('chat'), icon: <MessageCircle size={20} /> },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Drawer panel */}
        <Dialog.Content
          className={[
            'fixed top-0 z-50 h-full w-72 bg-white shadow-xl',
            'flex flex-col',
            'transition-transform duration-300 ease-in-out',
            isRtl ? 'left-0' : 'right-0',
            isOpen
              ? 'translate-x-0'
              : isRtl
                ? '-translate-x-full'
                : 'translate-x-full',
          ].join(' ')}
          // Prevent Radix from stealing focus to an element that doesn't exist yet during close
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Dialog.Title className="text-lg font-bold text-teal-700 flex items-center gap-2">
              <span className="text-xl">&#x1F1F4;&#x1F1F2;</span>
              {isRtl ? 'دُروب' : 'Duroob'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== `/${locale}` && pathname.startsWith(link.href));

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={[
                        'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50',
                      ].join(' ')}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Auth section */}
          <div className="border-t border-gray-100 px-3 py-4">
            {session?.user ? (
              <div className="space-y-3">
                <div className="px-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                </div>
                <div className="space-y-1">
                  <Link
                    href={`/${locale}/trips`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <Map size={18} />
                    {isRtl ? 'رحلاتي' : 'My Trips'}
                  </Link>
                  <Link
                    href={`/${locale}/saved`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <Heart size={18} />
                    {isRtl ? 'المحفوظة' : 'Saved'}
                  </Link>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    signOut({ callbackUrl: `/${locale}` });
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut size={20} />
                  {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href={`/${locale}/auth/signin`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <UserIcon size={20} />
                  {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
                <Link
                  href={`/${locale}/auth/signin`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                >
                  <UserIcon size={20} />
                  {isRtl ? 'إنشاء حساب' : 'Register'}
                </Link>
              </div>
            )}
          </div>

          {/* Language switcher */}
          <div className="border-t border-gray-100 px-3 py-4">
            <Link
              href={altPath}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50 transition-colors border border-gray-200"
            >
              <Globe size={20} />
              {isRtl ? 'EN' : 'العربية'}
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
