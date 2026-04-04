'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, Users, FileText, Clock, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatSession {
  id: string;
  userName: string;
  messageCount: number;
  hasPlan: boolean;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  plan_json: string | null;
  created_at: string;
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
    if (diffSec < 60) return '\u0627\u0644\u0622\u0646';
    if (diffMin < 60) return `\u0645\u0646\u0630 ${diffMin} \u062F\u0642\u064A\u0642\u0629`;
    if (diffHr < 24) return `\u0645\u0646\u0630 ${diffHr} \u0633\u0627\u0639\u0629`;
    if (diffDay < 30) return `\u0645\u0646\u0630 ${diffDay} \u064A\u0648\u0645`;
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

  // Conversation viewer state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

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

  async function toggleSession(sessionId: string) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      setMessages([]);
      return;
    }

    setExpandedSessionId(sessionId);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/${sessionId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  const textAlign = isRtl ? 'text-right' : 'text-left';

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${textAlign}`}>
          {isRtl ? '\u0633\u062C\u0644 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A' : 'Chat Sessions'}
        </h1>
        <p className={`text-sm text-gray-500 mt-1 ${textAlign}`}>
          {isRtl
            ? '\u0645\u0631\u0627\u0642\u0628\u0629 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0645\u0639 \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u0630\u0643\u064A'
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
                <p className="text-xs text-gray-500">{isRtl ? '\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062C\u0644\u0633\u0627\u062A' : 'Total Sessions'}</p>
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
                <p className="text-xs text-gray-500">{isRtl ? '\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0631\u0633\u0627\u0626\u0644' : 'Total Messages'}</p>
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
                <p className="text-xs text-gray-500">{isRtl ? '\u062E\u0637\u0637 \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647\u0627' : 'Plans Generated'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-600">{isRtl ? '\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A' : 'Error loading data'}: {error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            <Loader2 size={16} className="text-gray-400 animate-spin" />
            <span className="text-sm text-gray-500">{isRtl ? '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...' : 'Loading sessions...'}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  isRtl ? '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062C\u0644\u0633\u0629' : 'Session ID',
                  isRtl ? '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645' : 'User',
                  isRtl ? '\u0627\u0644\u0631\u0633\u0627\u0626\u0644' : 'Messages',
                  isRtl ? '\u062E\u0637\u0629' : 'Has Plan',
                  isRtl ? '\u0622\u062E\u0631 \u0631\u0633\u0627\u0644\u0629' : 'Last Message',
                  isRtl ? '\u0622\u062E\u0631 \u0646\u0634\u0627\u0637' : 'Last Active',
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
            {isRtl ? '\u0644\u0627 \u062A\u0648\u062C\u062F \u062C\u0644\u0633\u0627\u062A \u0645\u062D\u0627\u062F\u062B\u0629 \u0628\u0639\u062F' : 'No chat sessions yet'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            {isRtl
              ? '\u0633\u062A\u0638\u0647\u0631 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0647\u0646\u0627 \u0639\u0646\u062F\u0645\u0627 \u064A\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0645\u0639 \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u0630\u0643\u064A.'
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
                {isRtl ? '\u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A' : 'All Sessions'}
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
                    {isRtl ? '\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062C\u0644\u0633\u0629' : 'Session ID'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645' : 'User'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? '\u0627\u0644\u0631\u0633\u0627\u0626\u0644' : 'Messages'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? '\u062E\u0637\u0629' : 'Has Plan'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? '\u0622\u062E\u0631 \u0631\u0633\u0627\u0644\u0629' : 'Last Message'}
                  </th>
                  <th className={`px-6 py-3 font-medium text-gray-500 ${textAlign}`}>
                    {isRtl ? '\u0622\u062E\u0631 \u0646\u0634\u0627\u0637' : 'Last Active'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <>
                    <tr
                      key={session.id}
                      onClick={() => toggleSession(session.id)}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className={`px-6 py-3 font-mono text-xs text-gray-500 ${textAlign}`}>
                        <span className="flex items-center gap-1">
                          {expandedSessionId === session.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {truncate(session.id, 12)}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-gray-700 text-sm font-medium ${textAlign}`}>
                        {session.userName || (isRtl ? '\u0645\u062C\u0647\u0648\u0644' : 'Anonymous')}
                      </td>
                      <td className={`px-6 py-3 text-gray-600 text-sm ${textAlign}`}>
                        {session.messageCount}
                      </td>
                      <td className={`px-6 py-3 ${textAlign}`}>
                        {session.hasPlan ? (
                          <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            {isRtl ? '\u0646\u0639\u0645' : 'Yes'}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            {isRtl ? '\u0644\u0627' : 'No'}
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

                    {/* Expanded conversation viewer */}
                    {expandedSessionId === session.id && (
                      <tr key={`${session.id}-messages`}>
                        <td colSpan={6} className="px-0 py-0">
                          <div className="bg-gray-50 border-t border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-700">
                                {isRtl ? '\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629' : 'Conversation'}
                              </h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedSessionId(null); setMessages([]); }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {messagesLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-gray-400" />
                              </div>
                            ) : messages.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">
                                {isRtl ? '\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644' : 'No messages found'}
                              </p>
                            ) : (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {messages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                                        msg.role === 'user'
                                          ? 'bg-gray-200 text-gray-800'
                                          : 'bg-white text-gray-700 border border-gray-200'
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                      <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {sessions.map((session) => (
              <div key={session.id}>
                <div
                  onClick={() => toggleSession(session.id)}
                  className={`px-5 py-4 cursor-pointer ${textAlign}`}
                >
                  <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      {expandedSessionId === session.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {session.userName || (isRtl ? '\u0645\u062C\u0647\u0648\u0644' : 'Anonymous')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {relativeTime(session.updatedAt, isRtl)}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-gray-500">
                      {session.messageCount} {isRtl ? '\u0631\u0633\u0627\u0644\u0629' : 'messages'}
                    </span>
                    {session.hasPlan ? (
                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {isRtl ? '\u062E\u0637\u0629' : 'Plan'}
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

                {/* Mobile expanded conversation */}
                {expandedSessionId === session.id && (
                  <div className="bg-gray-50 border-t border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {isRtl ? '\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629' : 'Conversation'}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedSessionId(null); setMessages([]); }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {isRtl ? '\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644' : 'No messages found'}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                msg.role === 'user'
                                  ? 'bg-gray-200 text-gray-800'
                                  : 'bg-white text-gray-700 border border-gray-200'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
