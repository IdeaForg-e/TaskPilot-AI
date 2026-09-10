import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTasks, getApiErrorMessage } from '../services/api';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Filter } from 'lucide-react';

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const loadTasks = async () => {
    setLoading(true); setError(null);
    try { const res = await getTasks(); setTasks(res.data || []); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, []);

  const statuses  = useMemo(() => ['all', ...new Set(tasks.map((t) => t.status).filter(Boolean))], [tasks]);
  const types     = useMemo(() => ['all', ...new Set(tasks.map((t) => t.type || t.source).filter(Boolean))], [tasks]);
  const assignees = useMemo(() => {
    const list = tasks.map((t) => {
      const a = t.assignee;
      if (!a || a === 'null' || a === 'None' || a === 'undefined') {
        return 'Unassigned';
      }
      return a;
    }).filter(Boolean);
    return ['all', ...new Set(list)];
  }, [tasks]);
  const sources   = useMemo(() => ['all', ...new Set(tasks.flatMap((t) => t.source_platforms || []).filter(Boolean))], [tasks]);

  const filteredTasks = useMemo(() =>
    tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter && t.source !== typeFilter) return false;
      
      if (assigneeFilter !== 'all') {
        const val = t.assignee;
        const mappedVal = (!val || val === 'null' || val === 'None' || val === 'undefined') ? 'Unassigned' : val;
        if (mappedVal !== assigneeFilter) return false;
      }
      
      if (sourceFilter !== 'all' && !(t.source_platforms || []).includes(sourceFilter)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    }),
    [tasks, statusFilter, typeFilter, assigneeFilter, sourceFilter, searchQuery]
  );

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <LoadingSpinner label="Acquiring system task indexes..." />;
  if (error)   return <ErrorMessage message={error} onRetry={loadTasks} />;

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
              TASK_INDEX // REPOSITORY
            </span>
          </div>
          <h2 className="font-headline text-3xl font-light text-slate-100 tracking-tight">
            Task Directory
          </h2>
          <p className="font-body text-xs text-slate-400 mt-1 max-w-lg">
            Filter, inspect, and trace parsed engineering tasks fused from Jira, GitHub, Slack, and Email.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="glass-card px-4 py-2 flex items-center gap-2 border-white/10 shadow-lg">
            <span className="font-headline text-lg font-bold text-cyan-300 tabular-nums">
              {filteredTasks.length}
            </span>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              {filteredTasks.length === 1 ? 'TASK MATCH' : 'TASKS MATCHED'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="glass-card p-4 flex flex-wrap items-center gap-3 shadow-xl"
        style={{
          boxShadow: '0 12px 32px -10px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mr-1 pl-1">
          <Filter className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
            FILTERS:
          </span>
        </div>

        {[
          { value: statusFilter,   set: setStatusFilter,   options: statuses,  placeholder: 'Status: All' },
          { value: typeFilter,     set: setTypeFilter,     options: types,     placeholder: 'Type: All' },
          { value: assigneeFilter, set: setAssigneeFilter, options: assignees, placeholder: 'Assignee: All' },
          { value: sourceFilter,   set: setSourceFilter,   options: sources,   placeholder: 'Platform: All' },
        ].map(({ value, set, options, placeholder }, idx) => (
          <div key={idx} className="relative">
            <select
              value={value}
              onChange={(e) => set(e.target.value)}
              className="appearance-none bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 px-3.5 py-2 pr-8 text-xs font-mono rounded-xl cursor-pointer min-w-[140px] text-slate-200 outline-none transition-all shadow-inner"
            >
              {options.map((o) => (
                <option key={o} value={o} style={{ background: '#0d131f', color: '#e2e8f0' }}>
                  {o === 'all' ? placeholder : o.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="w-full">
        <TaskList
          tasks={filteredTasks}
          onSelectTask={handleSelectTask}
          selectedTaskId={selectedTask?.id}
          isDetailOpen={false}
        />
      </div>
    </div>

    {/* Task Detail Modal Pop-up (Rendered outside the transform-animated container) */}
    {selectedTask && (
      <TaskDetail task={selectedTask} tasks={tasks} onClose={() => setSelectedTask(null)} />
    )}
  </>
);
}