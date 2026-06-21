import { useEffect, useMemo, useState } from 'react';
import { getTasks, getApiErrorMessage } from '../services/api';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Filter } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const statuses = useMemo(
    () => ['all', ...new Set(tasks.map((t) => t.status).filter(Boolean))],
    [tasks]
  );
  const types = useMemo(
    () => ['all', ...new Set(tasks.map((t) => t.type || t.source).filter(Boolean))],
    [tasks]
  );
  const assignees = useMemo(
    () => ['all', ...new Set(tasks.map((t) => t.assignee).filter(Boolean))],
    [tasks]
  );
  const sources = useMemo(
    () => ['all', ...new Set(tasks.flatMap((t) => t.source_platforms || []).filter(Boolean))],
    [tasks]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter && t.source !== typeFilter)
          return false;
        if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;
        if (sourceFilter !== 'all' && !(t.source_platforms || []).includes(sourceFilter))
          return false;
        return true;
      }),
    [tasks, statusFilter, typeFilter, assigneeFilter, sourceFilter]
  );

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <LoadingSpinner label="Acquiring system task indexes..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  const selectClass =
    'glass-select px-4 py-2.5 text-xs font-semibold text-slate-350 rounded-xl cursor-pointer min-w-[150px]';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Tasks Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Filter, browse, and analyze parsed workspace tasks</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-850 px-3 py-1 text-xs font-bold text-slate-300 self-start sm:self-auto">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} Listed
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3.5 bg-slate-900/30 border border-slate-900 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-slate-500 mr-2 pl-1">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClass}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Streams / Types' : t}
            </option>
          ))}
        </select>
        
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className={selectClass}
        >
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a === 'all' ? 'All Assignees' : a}
            </option>
          ))}
        </select>
        
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={selectClass}
        >
          {sources.map((src) => (
            <option key={src} value={src}>
              {src === 'all' ? 'All Platforms / Sources' : src.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        <div className="flex-1 min-w-0">
          <TaskList 
            tasks={filteredTasks} 
            onSelectTask={handleSelectTask} 
            selectedTaskId={selectedTask?.id} 
            isDetailOpen={!!selectedTask}
          />
        </div>
        {selectedTask && (
          <TaskDetail task={selectedTask} tasks={tasks} onClose={() => setSelectedTask(null)} />
        )}
      </div>
    </div>
  );
}