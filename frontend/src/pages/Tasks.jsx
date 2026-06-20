import { useEffect, useMemo, useState } from 'react';
import { getTasks } from '../services/api';
import TaskList from '../components/tasks/TaskList';
import TaskDetail from '../components/tasks/TaskDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
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

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter && t.source !== typeFilter)
          return false;
        if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;
        return true;
      }),
    [tasks, statusFilter, typeFilter, assigneeFilter]
  );

  if (loading) return <LoadingSpinner label="Loading tasks..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  const selectClass =
    'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-600 focus:outline-none';

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-100">Tasks</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
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
              {t === 'all' ? 'All types / sources' : t}
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
              {a === 'all' ? 'All assignees' : a}
            </option>
          ))}
        </select>
      </div>

      <TaskList tasks={filteredTasks} onSelectTask={setSelectedTask} />

      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
