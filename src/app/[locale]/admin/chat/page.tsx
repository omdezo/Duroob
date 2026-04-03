'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, Users, FileText, Clock, Loader2 } from 'lucide-react';

interface ChatSession {
  id: string;
  userName: string;
  messageCount: number;
  hasPlan: boolean;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

function relativeTime(dateStr: string, isRtl: boolean): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (isRtl) {
    if (diffSec < 60) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    if (diffDay < 30) return `منذ ${diffDay} يوم`;
    return new Date(dateStr).toLocaleDateString('ar');
  }

  if (diffSec < 60) return 'just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr === 1) return '1 hour ago';
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 30) return `${diffDay} days ago`;
  return new Date(dateStr).toLocaleDateString('en');
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 4 ? '60%' : '70%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function ChatPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/chat');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  const textAlign = isRtl ? 'text-right' : 'text-left';

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${textAlign}`}>
          {isRtl ? 'سجل المحادثات' : 'Chat Sessions'}
        </h1>
        <p className={`text-sm text-gray-500 mt-1 ${textAlign}`}>
          {isRtl
            ? 'مراقبة جلسات المحادثة مع المخطط الذكي'
            : 'Monitor chat sessions with the Smart Planner'}
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && !error && sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className={textAlign}>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                <p className="text-xs text-gray-500">{isRtl ? 'إجمالي الجلسات' : 'Total Sessions'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-teal-50 p-2.5 rounded-xl">
                <MessageCircle size={20} className="text-teal-600" />
              </div>
              <div className={textAlign}>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.reduce((sum, s) => sum + s.messageCount, 0)}
                </p>
                <p className="text-xs text-gray-500">{isRtl ? 'إجمالي الرسائل' : 'Total Messages'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-purple-50 p-2.5 rounded-xl">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div className={textAlign}>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter((s) => s.hasPlan).length}
                </p>
                <p className="text-xs text-gray-500">{isRtl ? 'خطط تم إنشاؤها' : 'Plans Generated'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-600">{isRtl ? 'خطأ في تحميل البيانات' : 'Error loading data'}: {error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            <Loader2 size={16} className="text-gray-400 animate-spin" />
            <span className="text-sm text-gray-500">{isRtl ? 'جاري التحميل...' : 'Loading sessions...'}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  isRtl ? 'معرّف الجلسة' : 'Session ID',
                  isRtl ? 'المستخدم' : 'User',
                  isRtl ? 'الرسائل' : 'Messages',
                  isRtl ? 'خطة' : 'Has Plan',
                  isRtl ? 'آخر رسالة' : 'Last Message',
                  isRtl ? 'آخر نشاط' : 'Last Active',
                ].map((label) => (
                  <th key={label} className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sessions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <MessageCircle size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isRtl ? 'لا توجد جلسات محادثة بعد' : 'No chat sessions yet'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            {isRtl
              ? 'ستظهر جلسات المحادثة هنا عندما يتفاعل المستخدمون مع المخطط الذكي.'
              : 'Chat sessions will appear here as users interact with the Smart Planner.'}
          </p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && sessions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-100 bg-gray-50/60 ${textAlign}`}>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Clock size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                {isRtl ? 'جميع الجلسات' : 'All Sessions'}
              </h2>
              <span className="text-xs text-gray-400 ml-2">({sessions.length})</span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'معرّف الجلسة' : 'Session ID'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'المستخدم' : 'User'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'الرسائل' : 'Messages'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'خطة' : 'Has Plan'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'آخر رسالة' : 'Last Message'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'آخر نشاط' : 'Last Active'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className={`px-6 py-3 font-mono text-xs text-gray-500 ${textAlign}`}>
                      {truncate(session.id, 12)}
                    </td>
                    <td className={`px-6 py-3 text-gray-700 text-sm font-medium ${textAlign}`}>
                      {session.userName || (isRtl ? 'مجهول' : 'Anonymous')}
                    </td>
                    <td className={`px-6 py-3 text-gray-600 text-sm ${textAlign}`}>
                      {session.messageCount}
                    </td>
                    <td className={`px-6 py-3 ${textAlign}`}>
                      {session.hasPlan ? (
                        <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {isRtl ? 'نعم' : 'Yes'}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          {isRtl ? 'لا' : 'No'}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-3 text-gray-500 text-xs max-w-[200px] ${textAlign}`}>
                      {truncate(session.lastMessage, 50)}
                    </td>
                    <td className={`px-6 py-3 text-gray-400 text-xs whitespace-nowrap ${textAlign}`}>
                      {relativeTime(session.updatedAt, isRtl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {sessions.map((session) => (
              <div key={session.id} className={`px-5 py-4 ${textAlign}`}>
                <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-medium text-gray-700">
                    {session.userName || (isRtl ? 'مجهول' : 'Anonymous')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {relativeTime(session.updatedAt, isRtl)}
                  </span>
                </div>
                <div className={`flex items-center gap-2 mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-gray-500">
                    {session.messageCount} {isRtl ? 'رسالة' : 'messages'}
                  </span>
                  {session.hasPlan ? (
                    <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      {isRtl ? 'خطة' : 'Plan'}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {truncate(session.lastMessage, 60)}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {truncate(session.id, 16)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
