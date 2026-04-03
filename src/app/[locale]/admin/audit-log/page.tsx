'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Clock, Loader2, FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  destination_created: { bg: 'bg-green-50', text: 'text-green-700', labelEn: 'Created', labelAr: 'إنشاء' },
  destination_updated: { bg: 'bg-blue-50', text: 'text-blue-700', labelEn: 'Updated', labelAr: 'تحديث' },
  destination_deleted: { bg: 'bg-red-50', text: 'text-red-700', labelEn: 'Deleted', labelAr: 'حذف' },
  server_started: { bg: 'bg-gray-100', text: 'text-gray-600', labelEn: 'Server Started', labelAr: 'بدء الخادم' },
  user_registered: { bg: 'bg-purple-50', text: 'text-purple-700', labelEn: 'Registered', labelAr: 'تسجيل' },
};

const DEFAULT_STYLE = { bg: 'bg-gray-100', text: 'text-gray-600', labelEn: 'Action', labelAr: 'إجراء' };

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

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 4 ? '50%' : '65%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function AuditLogPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/audit-log');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.total ?? (data.entries || []).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, []);

  const textAlign = isRtl ? 'text-right' : 'text-left';

  function getActionStyle(action: string) {
    return ACTION_STYLES[action] || DEFAULT_STYLE;
  }

  function formatAction(action: string) {
    const style = getActionStyle(action);
    return isRtl ? style.labelAr : style.labelEn;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${textAlign}`}>
          {isRtl ? 'سجل المراجعة' : 'Audit Log'}
        </h1>
        <p className={`text-sm text-gray-500 mt-1 ${textAlign}`}>
          {isRtl
            ? 'تتبع جميع الإجراءات والتغييرات في المنصة'
            : 'Track all actions and changes on the platform'}
        </p>
      </div>

      {/* Total Count Badge */}
      {!loading && !error && entries.length > 0 && (
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 inline-flex items-center gap-2">
            <Shield size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {isRtl ? `${total} إدخال` : `${total} entries`}
            </span>
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
            <span className="text-sm text-gray-500">{isRtl ? 'جاري التحميل...' : 'Loading audit log...'}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  isRtl ? 'الوقت' : 'Time',
                  isRtl ? 'المسؤول' : 'Admin',
                  isRtl ? 'الإجراء' : 'Action',
                  isRtl ? 'الهدف' : 'Target',
                  isRtl ? 'التفاصيل' : 'Details',
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
      {!loading && !error && entries.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isRtl ? 'لا توجد إدخالات بعد' : 'No audit entries yet'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            {isRtl
              ? 'ستظهر إدخالات سجل المراجعة هنا عندما يتم تنفيذ إجراءات في المنصة.'
              : 'Audit log entries will appear here as actions are performed on the platform.'}
          </p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-100 bg-gray-50/60 ${textAlign}`}>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Clock size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                {isRtl ? 'سجل الأنشطة' : 'Activity Log'}
              </h2>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'الوقت' : 'Time'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'المسؤول' : 'Admin'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'الإجراء' : 'Action'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'الهدف' : 'Target'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? 'التفاصيل' : 'Details'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const style = getActionStyle(entry.action);
                  return (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className={`px-6 py-3 text-xs text-gray-400 whitespace-nowrap ${textAlign}`}>
                        {relativeTime(entry.timestamp, isRtl)}
                      </td>
                      <td className={`px-6 py-3 text-xs text-gray-600 ${textAlign}`}>
                        {entry.admin}
                      </td>
                      <td className={`px-6 py-3 ${textAlign}`}>
                        <span className={`inline-block px-2.5 py-0.5 ${style.bg} ${style.text} rounded-full text-xs font-medium`}>
                          {formatAction(entry.action)}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-xs text-gray-600 ${textAlign}`}>
                        <span className="text-gray-400">{entry.targetType}</span>
                        {entry.targetId && (
                          <span className="font-mono text-gray-500 ml-1">#{entry.targetId.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className={`px-6 py-3 text-xs text-gray-500 max-w-[250px] truncate ${textAlign}`}>
                        {entry.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {entries.map((entry) => {
              const style = getActionStyle(entry.action);
              return (
                <div key={entry.id} className={`px-5 py-4 ${textAlign}`}>
                  <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className={`inline-block px-2.5 py-0.5 ${style.bg} ${style.text} rounded-full text-xs font-medium`}>
                      {formatAction(entry.action)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {relativeTime(entry.timestamp, isRtl)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {entry.details || '-'}
                  </p>
                  <div className={`flex items-center gap-3 text-xs text-gray-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{entry.admin}</span>
                    <span className="text-gray-200">|</span>
                    <span>
                      {entry.targetType}
                      {entry.targetId && <span className="font-mono ml-1">#{entry.targetId.slice(0, 8)}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
