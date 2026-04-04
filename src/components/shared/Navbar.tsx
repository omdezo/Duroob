'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, Compass, CalendarDays, Globe, Menu, MessageCircle, Heart, Map } from 'lucide-react';
import MobileDrawer from './MobileDrawer';
import UserMenu from './UserMenu';

interface NavbarProps {
  locale: string;
}

export default function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const altLocale = locale === 'en' ? 'ar' : 'en';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isHome = pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`;

  // Swap locale in path
  const altPath = pathname.replace(`/${locale}`, `/${altLocale}`);

  const links = [
    { href: `/${locale}`, label: t('home'), icon: <Compass size={16} /> },
    { href: `/${locale}/destinations`, label: t('destinations'), icon: <MapPin size={16} /> },
    { href: `/${locale}/planner`, label: t('planner'), icon: <CalendarDays size={16} /> },
    { href: `/${locale}/chat`, label: t('chat'), icon: <MessageCircle size={16} /> },
    { href: `/${locale}/saved`, label: t('saved'), icon: <Heart size={16} /> },
    { href: `/${locale}/trips`, label: locale === 'ar' ? 'رحلاتي' : 'My Trips', icon: <Map size={16} /> },
  ];

  return (
    <>
      <nav className={`top-0 z-50 no-print transition-all duration-300 w-full ${
        isHome
          ? 'fixed bg-transparent'
          : 'sticky bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${locale}`} className={`flex items-center gap-2 font-bold text-xl ${isHome ? 'text-white' : 'text-teal-700'}`}>
              <span className="text-2xl">🇴🇲</span>
              <span className="hidden sm:inline">{locale === 'ar' ? 'دُروب' : 'Duroob'}</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1 sm:gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== `/${locale}` && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isHome
                        ? isActive ? 'text-[#d4a574]' : 'text-white/70 hover:text-white'
                        : isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Language switcher */}
              <Link
                href={altPath}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ms-2 ${
                  isHome ? 'text-white/70 hover:text-white border-white/20' : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50 border-gray-200'
                }`}
                title={altLocale === 'ar' ? 'عربي' : 'English'}
                aria-label={altLocale === 'ar' ? 'Switch to Arabic' : 'Switch to English'}
              >
                <Globe size={16} />
                <span>{altLocale === 'ar' ? 'عربي' : 'EN'}</span>
              </Link>

              {/* User menu */}
              <UserMenu locale={locale} />
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${isHome ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer locale={locale} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
