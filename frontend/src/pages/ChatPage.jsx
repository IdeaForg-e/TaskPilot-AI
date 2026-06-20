import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import EmptyState from '../components/common/EmptyState';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage(trimmed, {});
      const replyContent =
        res.data?.reply || res.data?.message || res.data?.content || '...';
      setMessages((prev) => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState message="Ask TaskPilot AI anything about your tasks." />
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </span>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="flex items-center gap-1.5 rounded-2xl bg-slate-800 px-4 py-2 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="border-t border-red-900/40 bg-red-950/20 px-4 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2 border-t border-slate-800 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Message TaskPilot AI..."
          className="max-h-32 flex-1 resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-600 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
