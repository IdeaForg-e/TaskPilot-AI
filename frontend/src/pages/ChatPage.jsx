import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, MessageSquare, Bell, CheckCircle2, Circle, Clock, Paperclip, Zap, Shield, X, FileIcon } from 'lucide-react';
import { sendChatMessage, getApiErrorMessage, getPlan, getPlansList, getTasks, updateTaskStatus } from '../services/api';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TaskDetail from '../components/tasks/TaskDetail';
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

  const [attachedFile, setAttachedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

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
    let textToSend = messageText || input.trim();
    if (!textToSend && !attachedFile) return;
    if (sending) return;
    setError(null);

    let displayContent = textToSend;
    if (attachedFile) {
      displayContent = textToSend 
        ? `${textToSend}\n\n📎 Attached: ${attachedFile.name}`
        : `📎 Attached: ${attachedFile.name}`;
    }

    setMessages((prev) => [...prev, { role: 'user', content: displayContent }]);
    if (!messageText) setInput('');
    setSending(true);
    // Prepare query content containing the text file contents (truncated to keep LLM token cost low)
    let finalQuery = textToSend;
    if (attachedFile && fileContent) {
      const truncated = fileContent.substring(0, 3000);
      finalQuery = `${textToSend || 'Analyze this file.'}\n\n[File Attachment: ${attachedFile.name}]\n\`\`\`\n${truncated}\n\`\`\``;
    }

    setAttachedFile(null);
    setFileContent('');

    try {
      const res = await sendChatMessage(finalQuery);
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
      <div className="pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
            COPILOT_TERMINAL // NEURAL_ORCHESTRATOR
          </span>
        </div>
        <h2 className="font-headline text-3xl font-light text-slate-100 tracking-tight">
          TaskPilot Copilot
        </h2>
        <p className="font-body text-xs text-slate-400 mt-1">
          Direct terminal interface with the multi-agent orchestrator — execute commands, inject emergency P1s, or query system telemetry.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" style={{ height: 'calc(100vh - 10.5rem)' }}>
        
        {/* ── Chat Panel ── */}
        <div
          className="lg:col-span-8 flex flex-col h-full glass-card overflow-hidden relative shadow-2xl"
          style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)' }}
        >
          {/* Session header bar */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0 bg-slate-950/40 border-b border-white/5"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SESSION_ACTIVE
            </span>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400">CORE:</span>
              <span className="text-slate-200 font-semibold">FASTAPI_ORCHESTRATOR</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                LIVE_STREAM
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="chat-scroll flex-1 overflow-y-auto p-5 space-y-4"
            style={{ background: 'rgba(8,11,17,0.6)' }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(142,205,255,0.2)]">
                  <Bot className="h-7 w-7 text-cyan-400" />
                </div>

                <div className="text-center max-w-md">
                  <h4 className="font-headline text-base font-semibold text-slate-100 mb-1.5">
                    TaskPilot Autonomous Copilot
                  </h4>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Ready to assist. Prompt the orchestrator to synthesize reports, triage backlogs, or parse ingested bug tickets.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {[
                    "Show deficient tasks",
                    "What is my highest priority task?",
                    "Summarize quality reports",
                    "Inject P1 task: Payment checkout flow failing on Safari"
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/8 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95 shadow-md"
                    >
                      {s}
                    </button>
                  ))}
                </div>
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
                            ? {
                                background: 'linear-gradient(135deg, #007db8 0%, #005a87 100%)',
                                border: '0.5px solid rgba(142,205,255,0.3)',
                                boxShadow: '0 0 12px rgba(142,205,255,0.2)',
                              }
                            : {
                                background: 'rgba(15,23,42,0.8)',
                                border: '0.5px solid rgba(142,205,255,0.2)',
                                boxShadow: '0 0 12px rgba(142,205,255,0.1)',
                              }
                        }
                      >
                        {isUser ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-cyan-400" />
                        )}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
                          isUser
                            ? 'bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-br-sm border border-cyan-400/30'
                            : 'bg-slate-900/85 text-slate-200 rounded-bl-sm border border-white/10'
                        }`}
                      >
                        {isUser ? (
                          <span className="font-body font-medium whitespace-pre-wrap">{m.content}</span>
                        ) : (
                          <div className="markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        )}
                        <p
                          className="font-mono mt-2 text-[9px] uppercase tracking-wider opacity-60"
                        >
                          {isUser ? 'LEAD_ENGINEER' : 'COPILOT_AGENT'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex items-start gap-3 animate-scale-in">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl animate-pulse bg-slate-900 border border-cyan-500/30"
                    >
                      <Bot className="h-4 w-4 text-cyan-400" />
                    </span>
                    <div
                      className="rounded-2xl px-4 py-3.5 bg-slate-900/80 border border-white/8 rounded-bl-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        {[0, 200, 400].map((delay, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-cyan-400"
                            style={{
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
            className="shrink-0 flex flex-col gap-2.5 p-4 bg-slate-950/60 border-t border-white/8"
          >
            {/* Hidden File Input */}
            <input 
              type="file" 
              id="chat-file-input" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  setAttachedFile(f);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setFileContent(event.target.result || '');
                  };
                  reader.readAsText(f);
                }
                e.target.value = '';
              }} 
            />

            {/* Attached file chip indicator */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 self-start animate-scale-in">
                <FileIcon className="h-3.5 w-3.5" />
                <span className="font-mono text-[10px] font-semibold truncate max-w-[200px]">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-cyan-400 hover:text-white transition-colors cursor-pointer ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <button
                onClick={() => document.getElementById('chat-file-input').click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-white/8 active:scale-95"
                title="Attach Context File"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type command, question, or task prompt (↵ to send)..."
                className="flex-1 resize-none rounded-xl px-4 py-2.5 text-xs font-body bg-slate-900/80 border border-white/10 text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                style={{ minHeight: '40px', maxHeight: '128px' }}
              />

              <button
                onClick={() => handleSend()}
                disabled={sending || (!input.trim() && !attachedFile)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 shadow-[0_0_16px_rgba(142,205,255,0.3)]"
                style={{
                  background: (sending || (!input.trim() && !attachedFile))
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #a5d8ff 0%, #70b8ff 50%, #4da3ff 100%)',
                  color: (sending || (!input.trim() && !attachedFile)) ? '#64748b' : '#080b11',
                  cursor: (sending || (!input.trim() && !attachedFile)) ? 'not-allowed' : 'pointer',
                  border: (sending || (!input.trim() && !attachedFile)) ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
                }}
                title="Send Command"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Footer telemetry chips */}
            <div className="flex items-center gap-4 px-1 pt-1 font-mono text-[9px] text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>TURBO_EXECUTION_ACTIVE</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span>ENCRYPTED_STREAM</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Active Context Panel ── */}
        <div
          className="lg:col-span-4 flex flex-col h-full glass-card overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)' }}
        >
          {/* Panel header */}
          <div
            className="px-5 py-3.5 shrink-0 bg-slate-950/40 border-b border-white/5 flex items-center justify-between"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              TELEMETRY_PANEL
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll space-y-5 p-5">
            {/* AI Reminders & Scheduled Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-3.5 w-3.5 text-cyan-400" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                  ACTIVE SCHEDULE REMINDERS
                </p>
              </div>

              {loadingReminders ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-6 bg-slate-900/40 rounded-2xl border border-white/5 p-4">
                  <p className="font-body text-xs font-semibold text-slate-400">No scheduled tasks today</p>
                  <p className="font-body text-[11px] mt-1 text-slate-500">
                    Run the planning agent to generate agenda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {scheduledTasks.map((slot, idx) => {
                    const currentStatus = taskStatusMap[slot.task_id] || 'open';
                    const isCompleted = currentStatus === 'done';
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 transition-all duration-200 border ${
                          isCompleted
                            ? 'bg-white/[0.01] border-white/5 opacity-50'
                            : 'bg-slate-900/60 border-white/8 hover:border-cyan-400/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                            className="mt-0.5 transition-colors cursor-pointer text-slate-400 hover:text-cyan-400"
                          >
                            {isCompleted
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              : <Circle className="h-4 w-4 text-slate-400" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const matched = tasksList.find((t) => t.id === slot.task_id);
                                setSelectedTask(matched || { id: slot.task_id, title: slot.title });
                              }}
                              className={`font-body text-xs font-semibold block text-left leading-snug hover:text-cyan-300 transition-colors cursor-pointer ${
                                isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            >
                              {slot.title}
                            </button>
                            <span className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-slate-400">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              <span>{slot.start_time} – {slot.end_time}</span>
                            </span>
                          </div>
                        </div>

                        {!isCompleted && (
                          <div
                            className="flex gap-2 mt-2.5 pt-2.5 border-t border-white/5"
                          >
                            <button
                              onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                              className="flex-1 rounded-lg py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 border border-white/8 transition-colors cursor-pointer"
                            >
                              MARK DONE
                            </button>
                            <button
                              onClick={() => setInput(`How is the progress on the task: "${slot.title}"?`)}
                              className="flex-1 rounded-lg py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-colors cursor-pointer"
                            >
                              STATUS CHECK
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent telemetry event log */}
            <div className="pt-2 border-t border-white/5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
                SYSTEM EVENT STREAM
              </p>
              <div className="space-y-2 font-mono text-[10px]">
                {[
                  { time: '09:41', event: 'Pipeline: full execution completed', color: '#4caf8e' },
                  { time: '09:38', event: 'Quality evaluation auditor certified', color: '#8ecdff' },
                  { time: '09:35', event: 'Signals fused from Jira + GitHub', color: '#f59e0b' },
                ].map(({ time, event, color }, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 font-semibold tabular-nums">
                      [{time}]
                    </span>
                    <span style={{ color }}>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal Pop-up */}
      {selectedTask && (
        <TaskDetail task={selectedTask} tasks={tasksList} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
