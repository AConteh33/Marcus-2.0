import React, { useState, useEffect, useRef } from 'react';
import {
  getConversations,
  getConversationsByTable,
  type Conversation,
  type ConversationMessage,
} from '../../services/conversationService';

type LanguageFilter = 'all' | 'ar' | 'en';

export const ConversationLog: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [tableFilter, setTableFilter] = useState('');
  const [langFilter, setLangFilter] = useState<LanguageFilter>('all');
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [selected]);

  const loadConversations = async (tableNumber?: number) => {
    setLoading(true);
    try {
      const data = tableNumber != null
        ? await getConversationsByTable(tableNumber)
        : await getConversations(100);
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableFilterChange = (value: string) => {
    setTableFilter(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      loadConversations(num);
    } else if (value === '') {
      loadConversations();
    }
  };

  const filtered = conversations.filter((c) => {
    if (langFilter !== 'all' && c.language !== langFilter) return false;
    return true;
  });

  const formatDuration = (c: Conversation): string => {
    if (!c.endedAt) return '—';
    const start = new Date(c.startedAt).getTime();
    const end = new Date(c.endedAt).getTime();
    const secs = Math.floor((end - start) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Conversations</h1>
          <p className="text-gray-500 text-sm">المحادثات</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={tableFilter}
              onChange={(e) => handleTableFilterChange(e.target.value)}
              placeholder="Filter by table"
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2.5 pl-9 w-48 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value as LanguageFilter)}
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-xl px-4 py-2.5 pl-9 appearance-none w-48 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
            >
              <option value="all">All languages / جميع اللغات</option>
              <option value="ar">Arabic / العربية</option>
              <option value="en">English</option>
            </select>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="w-5 h-5 animate-spin mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading conversations...
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No conversations yet</p>
            <p className="text-gray-600 text-xs mt-1">لا توجد محادثات بعد</p>
          </div>
        )}

        {/* Conversation List */}
        {!loading && filtered.length > 0 && !selected && (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                      <span className="text-emerald-400 text-sm font-bold">#{conv.tableNumber}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-medium">
                          Table # {conv.tableNumber}
                        </span>
                        <span className="text-gray-600 text-xs">|</span>
                        <span className="text-gray-400 text-xs">
                          {conv.language === 'ar' ? 'العربية' : 'English'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-500 text-xs">{formatTime(conv.startedAt)}</span>
                        <span className="text-gray-600 text-xs">|</span>
                        <span className="text-gray-500 text-xs">{conv.messages.length} messages</span>
                        <span className="text-gray-600 text-xs">|</span>
                        <span className="text-gray-500 text-xs">{formatDuration(conv)}</span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Transcript View */}
        {!loading && selected && (
          <div>
            {/* Back Button */}
            <button
              onClick={() => setSelected(null)}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to conversations
            </button>

            {/* Transcript Header */}
            <div className="bg-gray-900 rounded-t-xl border border-gray-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <span className="text-emerald-400 text-sm font-bold">#{selected.tableNumber}</span>
                </div>
                <div>
                  <span className="text-white font-semibold text-sm">
                    Table # {selected.tableNumber}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs">{formatTime(selected.startedAt)}</span>
                    <span className="text-gray-600 text-xs">|</span>
                    <span className="text-gray-400 text-xs">
                      {selected.language === 'ar' ? 'العربية' : 'English'}
                    </span>
                    <span className="text-gray-600 text-xs">|</span>
                    <span className="text-gray-400 text-xs">{selected.messages.length} messages</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">عرض المحادثة</span>
            </div>

            {/* Chat Bubbles */}
            <div
              ref={transcriptRef}
              className="bg-gray-900/50 border-x border-b border-gray-800 rounded-b-xl max-h-[60vh] overflow-y-auto p-5 space-y-4"
            >
              {selected.messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} lang={selected.language} />
              ))}
              {selected.messages.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  No messages in this conversation.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatBubble: React.FC<{ message: ConversationMessage; lang: string }> = ({ message, lang }) => {
  const isUser = message.role === 'user';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      className={`flex ${dir === 'rtl' ? (isUser ? 'justify-end' : 'justify-start') : (isUser ? 'justify-end' : 'justify-start')}`}
      dir={dir}
    >
      <div className={`max-w-xl ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-emerald-600 text-white rounded-br-md'
              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-md'
          }`}
        >
          {message.text}
        </div>
        <div className={`flex items-center gap-1.5 mt-1 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] font-medium ${isUser ? 'text-emerald-500/70' : 'text-gray-600'}`}>
            {isUser ? (lang === 'ar' ? 'أنت' : 'User') : (lang === 'ar' ? 'الذكاء' : 'AI')}
          </span>
          <span className="text-[10px] text-gray-700">
            {new Date(message.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
