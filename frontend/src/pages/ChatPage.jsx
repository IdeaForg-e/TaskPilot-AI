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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#6c6e36]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6c6e36]" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-[#525252] font-semibold">
              COPILOT_TERMINAL // NEURAL_ORCHESTRATOR
            </span>
          </div>
          <h2 className="font-headline text-2xl font-semibold text-[#3b3b3b] tracking-tight mt-0.5">
            TaskPilot Copilot
          </h2>
          <p className="font-body text-xs text-[#525252]">
            Direct terminal interface with the multi-agent orchestrator — execute commands, inject emergency P1s, or query system telemetry.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" style={{ height: 'calc(100vh - 10.5rem)' }}>
        
        {/* ── Chat Panel ── */}
        <div
          className="lg:col-span-8 flex flex-col h-full glass-card overflow-hidden relative shadow-md"
          style={{ background: '#ffffff', border: '1px solid #e2dfd8' }}
        >
          {/* Session header bar */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0 bg-[#faf8f5] border-b border-[#e2dfd8]"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold text-[#6c6e36] bg-[#6c6e36]/15 border border-[#6c6e36]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6c6e36]" />
              SESSION_ACTIVE
            </span>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[#525252]">CORE:</span>
              <span className="text-[#3b3b3b] font-semibold">FASTAPI_ORCHESTRATOR</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase font-semibold text-[#6c6e36] bg-[#6c6e36]/10 border border-[#6c6e36]/20">
                LIVE_STREAM
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="chat-scroll flex-1 overflow-y-auto p-5 space-y-4"
            style={{ background: '#f7ede1' }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-[#6c6e36]/15 border border-[#6c6e36]/30 flex items-center justify-center shadow-sm">
                  <Bot className="h-7 w-7 text-[#6c6e36]" />
                </div>

                <div className="text-center max-w-md">
                  <h4 className="font-headline text-base font-semibold text-[#3b3b3b] mb-1.5">
                    TaskPilot Autonomous Copilot
                  </h4>
                  <p className="font-body text-xs text-[#525252] leading-relaxed">
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
                      className="px-3.5 py-2 rounded-xl bg-[#efe0d0] border border-[#6c6e36]/30 text-xs font-mono text-[#3b3b3b] hover:bg-[#6c6e36] hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
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
                                background: '#6c6e36',
                                color: '#ffffff',
                                border: '1px solid #56582b',
                              }
                            : {
                                background: '#efe0d0',
                                border: '1px solid rgba(108,110,54,0.3)',
                              }
                        }
                      >
                        {isUser ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-[#6c6e36]" />
                        )}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-[#6c6e36] text-white rounded-br-sm border border-[#56582b]'
                            : 'bg-[#efe0d0] text-[#3b3b3b] rounded-bl-sm border border-[#6c6e36]/30'
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
                          className="font-mono mt-2 text-[9px] uppercase tracking-wider opacity-70"
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#efe0d0] border border-[#6c6e36]/30"
                    >
                      <Bot className="h-4 w-4 text-[#6c6e36]" />
                    </span>
                    <div
                      className="rounded-2xl px-4 py-3.5 bg-[#efe0d0] border border-[#6c6e36]/30 rounded-bl-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        {[0, 200, 400].map((delay, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-[#6c6e36]"
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
              style={{ borderTop: '1px solid rgba(168,67,50,0.3)', background: 'rgba(168,67,50,0.1)', color: '#a84332' }}
            >
              {error}
            </p>
          )}

          {/* Input bar */}
          <div
            className="shrink-0 flex flex-col gap-2.5 p-4 bg-[#efe0d0] border-t border-[#6c6e36]/30"
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
              }} 
            />

            {/* Attached File Preview Badge */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f4eb] border border-[#6c6e36]/30 w-fit text-xs text-[#2c332b] animate-scale-in">
                <FileIcon className="h-3.5 w-3.5 text-[#6c6e36]" />
                <span className="font-mono text-[11px] font-semibold truncate max-w-[200px]">{attachedFile.name}</span>
                <button 
                  onClick={() => { setAttachedFile(null); setFileContent(''); }}
                  className="p-0.5 hover:bg-black/10 rounded-full cursor-pointer text-[#525252] hover:text-[#3b3b3b]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('chat-file-input')?.click()}
                className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#e2dfd8] text-[#525252] hover:text-[#2c332b] hover:bg-[#f0f4eb] transition-colors cursor-pointer"
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
                className="flex-1 bg-[#ffffff] border border-[#6c6e36]/30 rounded-xl px-4 py-2.5 text-xs text-[#3b3b3b] placeholder:text-[#6e6e6e] outline-none focus:border-[#6c6e36] transition-colors"
              />

              <button
                onClick={() => handleSend()}
                disabled={sending || (!input.trim() && !attachedFile)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 shadow-sm"
                style={{
                  background: (sending || (!input.trim() && !attachedFile))
                    ? 'rgba(108,110,54,0.2)'
                    : '#6c6e36',
                  color: (sending || (!input.trim() && !attachedFile)) ? '#71717a' : '#ffffff',
                  cursor: (sending || (!input.trim() && !attachedFile)) ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
                title="Send Command"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Footer telemetry chips */}
            <div className="flex items-center gap-4 px-1 pt-1 font-mono text-[9px] text-[#525252]">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#6c6e36]" />
                <span>TURBO_EXECUTION_ACTIVE</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#6c6e36]" />
                <span>ENCRYPTED_STREAM</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Active Context Panel ── */}
        <div
          className="lg:col-span-4 flex flex-col h-full glass-card overflow-hidden shadow-md"
          style={{ background: '#ffffff', border: '1px solid #e2dfd8' }}
        >
          {/* Panel header */}
          <div
            className="px-5 py-3.5 shrink-0 bg-[#faf8f5] border-b border-[#e2dfd8] flex items-center justify-between"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#525252] font-semibold">
              TELEMETRY_PANEL
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#6c6e36]" />
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll space-y-5 p-5" style={{ background: '#f7ede1' }}>
            {/* AI Reminders & Scheduled Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-3.5 w-3.5 text-[#6c6e36]" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#3b3b3b] font-semibold">
                  ACTIVE SCHEDULE REMINDERS
                </p>
              </div>

              {loadingReminders ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-6 bg-[#efe0d0] rounded-2xl border border-[#6c6e36]/20 p-4">
                  <p className="font-body text-xs font-semibold text-[#3b3b3b]">No scheduled tasks today</p>
                  <p className="font-body text-[11px] mt-1 text-[#525252]">
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
                            ? 'bg-[#efe0d0]/50 border-[#6c6e36]/10 opacity-60'
                            : 'bg-[#efe0d0] border-[#6c6e36]/30 hover:border-[#6c6e36]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleTask(slot.task_id, currentStatus)}
                            className="mt-0.5 transition-colors cursor-pointer text-[#525252] hover:text-[#6c6e36]"
                          >
                            {isCompleted
                              ? <CheckCircle2 className="h-4 w-4 text-[#6c6e36]" />
                              : <Circle className="h-4 w-4 text-[#525252]" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const matched = tasksList.find((t) => t.id === slot.task_id);
                                setSelectedTask(matched || { id: slot.task_id, title: slot.title });
                              }}
                              className={`font-body text-xs font-semibold block text-left leading-snug hover:text-[#6c6e36] transition-colors cursor-pointer ${
                                isCompleted ? 'line-through text-[#525252]' : 'text-[#3b3b3b]'
                              }`}
                            >
                              {slot.title}
                            </button>
                            <span className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-[#525252]">
                              <Clock className="h-3 w-3 text-[#6c6e36]" />
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
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#525252] font-semibold mb-2.5">
                SYSTEM EVENT STREAM
              </p>
              <div className="space-y-2 font-mono text-[10px] leading-relaxed text-[#525252]">
                <p><span className="text-[#6c6e36]">[09:41]</span> Pipeline: full execution completed</p>
                <p><span className="text-[#6c6e36]">[09:38]</span> Quality evaluation auditor certified</p>
                <p><span className="text-[#6c6e36]">[09:35]</span> Signals fused from Jira + GitHub</p>
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
