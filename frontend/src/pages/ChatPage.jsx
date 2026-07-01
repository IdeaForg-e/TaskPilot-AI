import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, MessageSquare, Bell, CheckCircle2, Circle, Clock, Paperclip, Zap, Shield } from 'lucide-react';
import { sendChatMessage, getApiErrorMessage, getPlan, getPlansList, getTasks, updateTaskStatus } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const [reminderPlan, setReminderPlan] = useState(null);
  const [tasksList, setTasksList] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  const loadReminders = async () => {
    try {
      const listRes = await getPlansList();
      const dates = listRes.data || [];
      let dateToLoad = '';
      if (dates.length > 0) {
        dates.sort();
        dateToLoad = dates[dates.length - 1];
      } else {
        const today = new Date();
        dateToLoad = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      }
      const planRes = await getPlan(dateToLoad);
      setReminderPlan(planRes.data || null);
      const tasksRes = await getTasks();
      setTasksList(tasksRes.data || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => { loadReminders(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || sending) return;
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    if (!messageText) setInput('');
    setSending(true);
    try {
      const res = await sendChatMessage(textToSend);
      const reply = res.data?.reply || res.data?.message || res.data?.content || 'Unable to fetch response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      await loadReminders();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'done' ? 'open' : 'done';
    try {
      await updateTaskStatus(taskId, nextStatus);
      await loadReminders();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const taskStatusMap = {};
  tasksList.forEach((t) => { taskStatusMap[t.id] = t.status; });

  const scheduledTasks = (reminderPlan?.time_slots || reminderPlan?.time_blocks || [])
    .filter((slot) => slot.slot_type === 'task' && slot.task_id);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          TaskPilot Copilot
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          Chat directly with the orchestrator — execute tasks, query status, inject workflow commands.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" style={{ height: 'calc(100vh - 14rem)' }}>
        
        {/* ── Chat Panel ── */}
        <div className="lg:col-span-8 flex flex-col h-full glass-card overflow-hidden relative">
          {/* Session header bar */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="chip chip-blue text-[0.5rem] py-0.5"
            >
              Session Active
            </span>
            <div className="flex items-center gap-2">
              <span className="font-headline text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                Orchestrator:
              </span>
              <span className="font-headline text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Active
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="chip chip-green text-[0.5rem] py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4caf8e]" />
                Live Data Stream
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.1)' }}>
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
                      className={`flex items-start gap-3 animate-scale-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={
                          isUser
                            ? { background: 'var(--primary-container)', border: '0.5px solid rgba(142,205,255,0.2)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }
                        }
                      >
                        {isUser
                          ? <User className="h-4 w-4 text-white" />
                          : <Bot className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                        }
                      </span>

                      {/* Bubble */}
                      <div
                        className="max-w-[72%] rounded-2xl px-4 py-3 text-xs leading-relaxed"
                        style={
                          isUser
                            ? {
                                background: 'var(--primary-container)',
                                color: '#fff',
                                borderBottomRightRadius: '4px',
                              }
                            : {
                                background: 'rgba(255,255,255,0.03)',
                                border: '0.5px solid rgba(255,255,255,0.07)',
                                color: 'var(--on-surface)',
                                borderBottomLeftRadius: '4px',
                              }
                        }
                      >
                        {isUser ? (
                          <span className="font-body font-medium">{m.content}</span>
                        ) : (
                          <div className="markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        )}
                        <p
                          className="font-body mt-2 text-[0.5rem]"
                          style={{ color: isUser ? 'rgba(255,255,255,0.5)' : 'var(--outline)', opacity: 0.7 }}
                        >
                          {isUser ? 'You' : 'Copilot'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex items-start gap-3 animate-scale-in">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
                    >
                      <Bot className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    </span>
                    <div
                      className="rounded-2xl px-4 py-3.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: '4px' }}
                    >
                      <div className="flex items-center gap-1.5">
                        {[0, 200, 400].map((delay, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: 'var(--primary)',
                              animation: `typingBounce 1s ${delay}ms infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error bar */}
          {error && (
            <p
              className="shrink-0 px-5 py-2.5 text-xs font-semibold"
              style={{ borderTop: '0.5px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444' }}
            >
              {error}
            </p>
          )}

          {/* Input bar */}
          <div
            className="shrink-0 flex flex-col gap-2 p-4"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-end gap-3">
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors"
                style={{ border: '0.5px solid rgba(255,255,255,0.08)', color: 'var(--outline)' }}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type a command or ask Copilot..."
                className="glass-input flex-1 resize-none rounded-xl px-4 py-2.5 text-xs"
                style={{ minHeight: '40px', maxHeight: '128px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
                style={{
                  background: 'var(--primary-container)',
                  boxShadow: '0 4px 12px rgba(0,125,184,0.3)',
                  opacity: (sending || !input.trim()) ? 0.5 : 1,
                  cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            {/* Footer chips */}
            <div className="flex items-center gap-3 px-1">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>Turbo Mode Active</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" style={{ color: '#4caf8e' }} />
                <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.5rem' }}>End-to-End Encrypted</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Active Context Panel ── */}
        <div className="lg:col-span-4 flex flex-col h-full glass-card overflow-hidden">
          {/* Panel header */}
          <div
            className="px-5 py-4 shrink-0"
            style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <p className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
              Active Context
            </p>
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll">
            {/* Environment */}
            <div className="p-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>Environment</span>
                <span
                  className="chip text-[0.5rem] py-0.5"
                  style={{ background: 'rgba(142,205,255,0.1)', color: 'var(--primary)', border: '0.5px solid rgba(142,205,255,0.2)' }}
                >
                  PROD-A
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-xs" style={{ color: 'var(--on-surface-variant)' }}>Uptime</span>
                <span className="font-headline text-sm font-semibold" style={{ color: '#4caf8e' }}>99.998%</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: '99.998%', background: '#4caf8e' }} />
              </div>
            </div>

            {/* AI Reminders & Scheduled Tasks */}
            <div className="p-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
                <p className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>
                  AI Reminders & Check-ins
                </p>
              </div>

              {loadingReminders ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="font-body text-xs font-semibold" style={{ color: 'var(--outline)' }}>No scheduled tasks today</p>
                  <p className="font-body text-[0.6rem] mt-1" style={{ color: 'var(--outline)', opacity: 0.7 }}>
                    Run the planning agent to populate schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledTasks.map((slot, idx) => {
                    const currentStatus = taskStatusMap[slot.task_id] || 'open';
                    const isCompleted = currentStatus === 'done';
                    return (
                      <div
                        key={idx}
                        className="rounded-xl p-3 transition-all"
                        style={{
                          background: isCompleted ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                          border: `0.5px solid ${isCompleted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'}`,
                          opacity: isCompleted ? 0.6 : 1,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                            className="mt-0.5 transition-colors"
                            style={{ color: isCompleted ? 'var(--primary)' : 'var(--outline)' }}
                          >
                            {isCompleted
                              ? <CheckCircle2 className="h-4 w-4" />
                              : <Circle className="h-4 w-4" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`font-body text-[0.7rem] font-semibold block leading-snug ${isCompleted ? 'line-through' : ''}`}
                              style={{ color: isCompleted ? 'var(--outline)' : 'var(--on-surface)' }}
                            >
                              {slot.title}
                            </span>
                            <span className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                              <span className="font-body text-[0.6rem]" style={{ color: 'var(--outline)' }}>
                                {slot.start_time} – {slot.end_time}
                              </span>
                            </span>
                          </div>
                        </div>
                        {!isCompleted && (
                          <div
                            className="flex gap-2 mt-2.5 pt-2.5"
                            style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
                          >
                            <button
                              onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                              className="flex-1 rounded-lg py-1 text-[0.6rem] font-semibold font-body transition-colors"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', color: 'var(--on-surface-variant)' }}
                            >
                              Mark Done
                            </button>
                            <button
                              onClick={() => handleSend(`How is the progress on the task: "${slot.title}"?`)}
                              className="flex-1 rounded-lg py-1 text-[0.6rem] font-semibold font-body transition-colors"
                              style={{ background: 'rgba(142,205,255,0.08)', border: '0.5px solid rgba(142,205,255,0.15)', color: 'var(--primary)' }}
                            >
                              Ask Copilot
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent events log */}
            <div className="p-5">
              <p className="label-caps mb-3" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>Recent Events</p>
              <div className="space-y-2">
                {[
                  { time: '09:41', event: 'Pipeline: run completed', color: '#4caf8e' },
                  { time: '09:38', event: 'Quality evaluation done', color: 'var(--primary)' },
                  { time: '09:35', event: 'Extraction agent started', color: '#f59e0b' },
                ].map(({ time, event, color }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="font-body text-[0.6rem] shrink-0 font-semibold"
                      style={{ color: 'var(--outline)' }}
                    >
                      [{time}]
                    </span>
                    <span className="font-body text-[0.6rem]" style={{ color }}>
                      {event}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}