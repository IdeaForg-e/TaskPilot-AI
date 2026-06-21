import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, MessageSquare, Bell, CheckCircle2, Circle, Clock } from 'lucide-react';
import { sendChatMessage, getApiErrorMessage, getPlan, getPlansList, getTasks, updateTaskStatus } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Reminders states
  const [reminderPlan, setReminderPlan] = useState(null);
  const [tasksList, setTasksList] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  const loadReminders = async () => {
    try {
      const listRes = await getPlansList();
      const dates = listRes.data || [];
      let dateToLoad = '2026-06-18'; // default fallback demo date
      if (dates.length > 0) {
        dates.sort();
        dateToLoad = dates[dates.length - 1]; // Load the latest planned day
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

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || sending) return;

    setError(null);
    const userMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) {
      setInput('');
    }
    setSending(true);

    try {
      const res = await sendChatMessage(textToSend);
      const replyContent =
        res.data?.reply || res.data?.message || res.data?.content || 'Unable to fetch response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: replyContent }]);
      
      // Proactively refresh tasks and reminders list in case a task was injected or pipeline run
      await loadReminders();
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

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'done' ? 'open' : 'done';
    try {
      await updateTaskStatus(taskId, nextStatus);
      // Reload reminders to fetch updated status
      await loadReminders();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  // Compile a map of task IDs to current status
  const taskStatusMap = {};
  tasksList.forEach((t) => {
    taskStatusMap[t.id] = t.status;
  });

  // Extract scheduled task blocks for the reminders panel
  const scheduledTasks = (reminderPlan?.time_slots || reminderPlan?.time_blocks || [])
    .filter((slot) => slot.slot_type === 'task' && slot.task_id);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">TaskPilot Copilot</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chat directly with the orchestrator client and execute tasks</p>
        </div>
      </div>

      {/* Main Grid: Split Chat and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-14.5rem)]">
        {/* Chat Component Viewport */}
        <div className="lg:col-span-8 flex flex-col h-full glass-card overflow-hidden relative shadow-xl">
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
                        {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                      </span>
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[70%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border border-violet-500/10'
                            : 'bg-slate-900/60 border border-slate-850/80 text-slate-200 backdrop-blur-sm'
                        }`}
                      >
                        {isUser ? (
                          m.content
                        ) : (
                          <div className="markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        )}
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
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="inline-flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 border border-violet-500/20 text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Workspace Reminders Panel */}
        <div className="lg:col-span-4 flex flex-col h-full glass-card p-5 space-y-4 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/15 border border-violet-500/10 text-violet-400">
              <Bell className="h-4 w-4 animate-bounce" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-200">AI Reminders & Check-ins</h3>
              <p className="text-[10px] text-slate-450">Active schedule tasks based on your AI plan</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 chat-scroll">
            {loadingReminders ? (
              <div className="flex flex-col items-center justify-center h-48">
                <LoadingSpinner size="sm" label="Syncing reminders..." />
              </div>
            ) : scheduledTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 h-48 space-y-2">
                <p className="text-[11px] font-bold text-slate-400">No scheduled tasks today</p>
                <p className="text-[9px] text-slate-500">Run the planning agent to schedule tasks into time slots.</p>
              </div>
            ) : (
              scheduledTasks.map((slot, idx) => {
                const currentStatus = taskStatusMap[slot.task_id] || 'open';
                const isCompleted = currentStatus === 'done';

                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isCompleted 
                        ? 'bg-slate-950/20 border-slate-900/40 opacity-60' 
                        : 'bg-slate-900/30 border-slate-850/80 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox toggle status */}
                      <button 
                        onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                        className="mt-0.5 text-slate-500 hover:text-violet-400 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1.5">
                        <span className={`text-[11px] font-bold leading-snug block ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}>
                          {slot.title}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[9px] text-slate-450 font-bold">
                            <Clock className="h-3 w-3 text-cyan-400" />
                            {slot.start_time} - {slot.end_time}
                          </span>
                          {!isCompleted && slot.priority_level && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide ${
                              slot.priority_level === 'critical' 
                                ? 'bg-rose-950/40 text-rose-405 border border-rose-900/30' 
                                : slot.priority_level === 'high'
                                ? 'bg-amber-950/40 text-amber-405 border border-amber-900/30'
                                : 'bg-slate-950/40 text-slate-450 border border-slate-900/30'
                            }`}>
                              {slot.priority_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Proactive check-in action buttons */}
                    {!isCompleted && (
                      <div className="flex items-center gap-2 border-t border-slate-900/40 mt-3 pt-2">
                        <button
                          onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                          className="flex-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-[9px] font-bold text-slate-350 py-1 transition-colors border border-slate-850"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleSend(`How is the progress on the task: "${slot.title}"?`)}
                          className="flex-1 rounded-lg bg-violet-605 hover:bg-violet-555 text-[9px] font-bold text-white py-1 transition-colors border border-violet-500/10"
                        >
                          Ask Copilot
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}