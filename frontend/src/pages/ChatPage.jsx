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
      console.error('Failed to toggle task:', err);
    }
  };

  const scheduledTasks = reminderPlan?.time_slots?.filter((s) => s.task_id) || [];
  const taskStatusMap = {};
  tasksList.forEach((t) => {
    taskStatusMap[t.id] = t.status;
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-cyan-400 font-semibold">
              COPILOT_TERMINAL // NEURAL_ORCHESTRATOR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            TaskPilot Copilot
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct terminal interface with the multi-agent orchestrator — execute commands, inject emergency P1s, or query system telemetry.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" style={{ height: 'calc(100vh - 10.5rem)' }}>
        
        {/* ── Chat Panel ── */}
        <div className="lg:col-span-8 flex flex-col h-full cockpit-card bg-[#0f172a] border border-[#1e293b] shadow-xl overflow-hidden relative">
          {/* Session header bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 bg-[#090d16] border-b border-[#1e293b]">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SESSION_ACTIVE
            </span>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-500">CORE:</span>
              <span className="text-slate-300 font-semibold">FASTAPI_ORCHESTRATOR</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
                LIVE_STREAM
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#090d16]"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 space-y-5">
                <div className="h-12 w-12 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
                  <Bot className="h-6 w-6 text-cyan-400" />
                </div>

                <div className="text-center max-w-md">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    TaskPilot Autonomous Copilot
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
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
                      className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-xs font-mono text-cyan-300 hover:bg-[#162032] hover:border-cyan-500/40 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {messages.map((m, i) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 animate-scale-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                          isUser
                            ? 'bg-cyan-600 text-white'
                            : 'bg-[#111827] border border-[#1e293b] text-cyan-400'
                        }`}
                      >
                        {isUser ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`max-w-[78%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-cyan-950/60 text-cyan-100 rounded-tr-none border border-cyan-800/40'
                            : 'bg-[#111827] text-slate-200 rounded-tl-none border border-[#1e293b]'
                        }`}
                      >
                        {isUser ? (
                          <span className="font-medium whitespace-pre-wrap">{m.content}</span>
                        ) : (
                          <div className="prose prose-invert prose-xs max-w-none text-slate-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        )}
                        <p className="font-mono mt-1.5 text-[9px] uppercase tracking-wider text-slate-500">
                          {isUser ? 'LEAD_ENGINEER' : 'COPILOT_AGENT'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex items-start gap-2.5 animate-scale-in">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#111827] border border-[#1e293b] text-cyan-400">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <div className="rounded-lg px-3.5 py-2 bg-[#111827] border border-[#1e293b] rounded-tl-none">
                      <div className="flex items-center gap-1.5">
                        {[0, 200, 400].map((delay, i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                            style={{
                              animation: `pulse 1s ${delay}ms infinite`,
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
            <p className="shrink-0 px-4 py-2 text-xs font-semibold bg-rose-950/60 border-t border-rose-800/40 text-rose-300">
              {error}
            </p>
          )}

          {/* Input bar */}
          <div className="shrink-0 flex flex-col gap-2 p-3 bg-[#0f172a] border-t border-[#1e293b]">
            {/* Attached File Preview Badge */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/40 w-fit text-xs text-cyan-200 animate-scale-in">
                <FileIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-mono text-[10px] font-semibold truncate max-w-[200px]">{attachedFile.name}</span>
                <button 
                  onClick={() => { setAttachedFile(null); setFileContent(''); }}
                  className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
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
                }} 
              />

              <button
                type="button"
                onClick={() => document.getElementById('chat-file-input')?.click()}
                className="p-2 rounded bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Attach file (text, code, json, log)"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type command, question, or task prompt (↵ to send)..."
                disabled={sending}
                className="flex-1 bg-[#090d16] border border-[#1e293b] rounded px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-colors"
              />

              <button
                onClick={() => handleSend()}
                disabled={sending || (!input.trim() && !attachedFile)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-md shadow-cyan-600/30"
                title="Send Command"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Footer telemetry chips */}
            <div className="flex items-center gap-4 px-0.5 font-mono text-[9px] text-slate-500">
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

        {/* ── Active Context Panel (Right Sidecar) ── */}
        <div className="lg:col-span-4 flex flex-col h-full cockpit-card bg-[#0f172a] border border-[#1e293b] shadow-xl overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-2.5 shrink-0 bg-[#090d16] border-b border-[#1e293b] flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              TELEMETRY_PANEL
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,210,255,0.8)]" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#090d16]">
            {/* AI Reminders & Scheduled Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Bell className="h-3.5 w-3.5 text-cyan-400" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                  ACTIVE SCHEDULE REMINDERS
                </p>
              </div>

              {loadingReminders ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-5 bg-[#0f172a] rounded border border-[#1e293b] p-3">
                  <p className="text-xs font-semibold text-slate-300">No scheduled tasks today</p>
                  <p className="text-[10px] mt-0.5 text-slate-500 font-mono">
                    Run the planning agent to generate agenda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledTasks.map((slot, idx) => {
                    const currentStatus = taskStatusMap[slot.task_id] || 'open';
                    const isCompleted = currentStatus === 'done';
                    return (
                      <div
                        key={idx}
                        className={`rounded p-2.5 transition-all duration-150 border ${
                          isCompleted
                            ? 'bg-[#0f172a]/50 border-[#1e293b] opacity-60'
                            : 'bg-[#0f172a] border-[#1e293b] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                            className="mt-0.5 transition-colors cursor-pointer text-slate-500 hover:text-cyan-400"
                          >
                            {isCompleted
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              : <Circle className="h-3.5 w-3.5 text-slate-500" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const matched = tasksList.find((t) => t.id === slot.task_id);
                                setSelectedTask(matched || { id: slot.task_id, title: slot.title });
                              }}
                              className={`text-xs font-medium block text-left leading-snug hover:text-cyan-300 transition-colors cursor-pointer ${
                                isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            >
                              {slot.title}
                            </button>
                            <span className="flex items-center gap-1 mt-1 font-mono text-[9px] text-slate-500">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              <span>{slot.start_time} - {slot.end_time}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Event Logs */}
            <div className="pt-2 border-t border-[#1e293b]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                SYSTEM EVENT STREAM
              </p>
              <div className="space-y-1.5 font-mono text-[9px] leading-relaxed text-slate-400">
                <p><span className="text-cyan-400">[09:41]</span> Pipeline: full execution completed</p>
                <p><span className="text-emerald-400">[09:38]</span> Quality evaluation auditor certified</p>
                <p><span className="text-cyan-400">[09:35]</span> Signals fused from Jira + GitHub</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
