'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, MapPin, Map, MessageCircle, X } from 'lucide-react';
import { DESTINATIONS } from '@/data/destinations';

interface CommandPaletteProps {
  locale: string;
}

export default function CommandPalette({ locale }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const t = useTranslations('nav');

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return DESTINATIONS.filter(
      (d) =>
        d.name.en.toLowerCase().includes(q) ||
        d.name.ar.includes(query) ||
        d.region.en.toLowerCase().includes(q) ||
        d.region.ar.includes(query)
    ).slice(0, 8);
  }, [query]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      router.push(path);
    },
    [router]
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[100] animate-fade-in" />
        <Dialog.Content className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden animate-slide-up">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search size={20} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'ابحث عن وجهة...' : 'Search destinations...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-base text-gray-900 placeholder:text-gray-400 bg-transparent"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {locale === 'ar' ? 'الوجهات' : 'Destinations'}
                </p>
                {results.map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => navigate(`/${locale}/destinations/${dest.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-start"
                  >
                    <MapPin size={16} className="text-teal-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dest.name[locale as 'en' | 'ar'] ?? dest.name.en}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dest.region[locale as 'en' | 'ar'] ?? dest.region.en}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions */}
            {!query.trim() && (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </p>
                <button
                  onClick={() => navigate(`/${locale}/planner`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-start"
                >
                  <Map size={16} className="text-teal-600" />
                  <span className="text-sm text-gray-700">{t('planner')}</span>
                </button>
                <button
                  onClick={() => navigate(`/${locale}/chat`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-start"
                >
                  <MessageCircle size={16} className="text-teal-600" />
                  <span className="text-sm text-gray-700">{t('chat')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{locale === 'ar' ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}</span>
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
