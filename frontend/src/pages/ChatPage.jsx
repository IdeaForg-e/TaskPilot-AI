import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, MessageSquare, Terminal } from 'lucide-react';
import { sendChatMessage, getApiErrorMessage } from '../services/api';
import EmptyState from '../components/common/EmptyState';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
      const res = await sendChatMessage(trimmed);
      const replyContent =
        res.data?.reply || res.data?.message || res.data?.content || 'Unable to fetch response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      setError(getApiErrorMessage(err));
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">TaskPilot Copilot</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chat directly with the orchestrator client and execute tasks</p>
        </div>
      </div>

      <div className="glass-card flex h-[calc(100vh-14.5rem)] flex-col shadow-xl overflow-hidden relative">
        {/* Chat viewport */}
        <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState 
                message="Welcome to TaskPilot AI. Ask me about tasks status, quality grades, priority models, or prompt the orchestrator directly." 
                icon={MessageSquare}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3.5 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    } animate-scale-in`}
                  >
                    {/* Avatar */}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-md transition-transform duration-200 hover:scale-105 ${
                        isUser
                          ? 'bg-gradient-to-tr from-violet-650 to-indigo-600 text-white border-violet-500/20'
                          : 'bg-slate-900 border-slate-800 text-cyan-400'
                      }`}
                    >
                      {isUser ? (
                        <User className="h-4.5 w-4.5" />
                      ) : (
                        <Bot className="h-4.5 w-4.5" />
                      )}
                    </span>
                    
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[70%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border border-violet-500/10'
                          : 'bg-slate-900/60 border border-slate-850/80 text-slate-205 backdrop-blur-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              
              {/* Sending / Thinking visual state */}
              {sending && (
                <div className="flex items-start gap-3.5 animate-scale-in">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-cyan-450 animate-pulse">
                    <Bot className="h-4.5 w-4.5" />
                  </span>
                  
                  <div className="bg-slate-900/60 border border-slate-850/80 rounded-2xl px-4 py-3.5 backdrop-blur-sm">
                    {/* Premium bouncing dots typing indicator */}
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-violet-400 animate-[typingBounce_1s_infinite]" />
                      <span className="h-2 w-2 rounded-full bg-violet-450 animate-[typingBounce_1s_infinite_200ms]" />
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-[typingBounce_1s_infinite_400ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="border-t border-red-900/30 bg-red-950/20 px-5 py-3 text-xs font-semibold text-red-400">
            {error}
          </p>
        )}

        {/* Input panel */}
        <div className="flex items-end gap-3.5 border-t border-slate-900/80 bg-slate-950/60 p-4.5 backdrop-blur-md">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Prompt Copilot..."
            className="glass-input max-h-32 flex-1 resize-none rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="inline-flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 border border-violet-500/20 text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}