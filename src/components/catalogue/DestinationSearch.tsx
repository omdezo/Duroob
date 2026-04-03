'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface DestinationSearchProps {
  locale: string;
  initialQuery: string;
}

export default function DestinationSearch({ locale, initialQuery }: DestinationSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSearch(value: string) {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleClear() {
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={locale === 'ar' ? 'ابحث عن وجهة...' : 'Search destinations...'}
        className="w-full ps-9 pe-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
