import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTasks, getApiErrorMessage } from '../services/api';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Filter } from 'lucide-react';

export default function Tasks() {
  const [searchParams] = useSearchParams();
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
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
                TASK_INDEX // REPOSITORY
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Task Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Filter, inspect, and trace parsed engineering tasks fused from Jira, GitHub, Slack, and Email.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-md bg-[#0f172a] border border-[#1e293b] flex items-center gap-2">
              <span className="text-base font-bold text-cyan-400 font-mono tabular-nums">
                {filteredTasks.length}
              </span>
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                {filteredTasks.length === 1 ? 'TASK MATCH' : 'TASKS MATCHED'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="cockpit-card p-3 flex flex-wrap items-center gap-2.5 bg-[#0f172a] border border-[#1e293b]">
          <div className="flex items-center gap-1.5 mr-1 pl-1">
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
                className="appearance-none bg-[#090d16] hover:bg-[#111827] border border-[#1e293b] focus:border-cyan-400 px-3 py-1.5 pr-7 text-xs font-mono rounded cursor-pointer min-w-[130px] text-slate-200 outline-none transition-all"
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o === 'all' ? placeholder : o.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">
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

      {/* Task Detail Modal Pop-up */}
      {selectedTask && (
        <TaskDetail task={selectedTask} tasks={tasks} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}