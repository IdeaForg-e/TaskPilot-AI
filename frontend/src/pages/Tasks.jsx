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

  const [openDropdown, setOpenDropdown] = useState(null);

  const loadTasks = async () => {
    setLoading(true); setError(null);
    try { const res = await getTasks(); setTasks(res.data || []); }
    catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, []);

  // Auto close dropdowns on click outside
  useEffect(() => {
    const handleClose = () => setOpenDropdown(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

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
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            Task Directory
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Filter, browse, and analyze parsed workspace tasks
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span
            className="glass-card px-4 py-2 font-headline text-sm font-semibold"
            style={{ color: 'var(--on-surface)' }}
          >
            {filteredTasks.length}
          </span>
          <span className="font-body text-xs" style={{ color: 'var(--outline)' }}>
            {filteredTasks.length === 1 ? 'Task' : 'Tasks'} Listed
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="glass-card p-3 flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 mr-1 pl-1">
          <Filter className="h-3.5 w-3.5" style={{ color: 'var(--outline)' }} />
          <span className="label-caps" style={{ color: 'var(--outline)', fontSize: '0.55rem' }}>Filters</span>
        </div>

        {[
          { value: statusFilter,   set: setStatusFilter,   options: statuses,  placeholder: 'All Statuses' },
          { value: typeFilter,     set: setTypeFilter,     options: types,     placeholder: 'All Types' },
          { value: assigneeFilter, set: setAssigneeFilter, options: assignees, placeholder: 'All Assignees' },
          { value: sourceFilter,   set: setSourceFilter,   options: sources,   placeholder: 'All Platforms' },
        ].map(({ value, set, options, placeholder }, idx) => {
          const isOpen = openDropdown === idx;
          const displayLabel = value === 'all' ? placeholder : value;

          return (
            <div key={idx} className="relative select-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(isOpen ? null : idx);
                }}
                className="glass-card flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-body rounded-xl cursor-pointer min-w-[140px] text-left transition-colors hover:border-primary/30 text-on-surface"
              >
                <span className="truncate pr-1">{displayLabel}</span>
                <span className="text-[8px] opacity-40 shrink-0">▼</span>
              </button>

              {isOpen && (
                <div
                  className="glass-card absolute left-0 mt-1.5 min-w-[170px] max-h-60 overflow-y-auto rounded-xl p-1 shadow-2xl z-40 animate-scale-in"
                  style={{
                    background: 'var(--surface-container-high)',
                    borderColor: 'var(--outline-variant)',
                  }}
                >
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        set(option);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-body rounded-lg cursor-pointer block truncate dropdown-option ${
                        option === value ? 'active' : ''
                      }`}
                    >
                      {option === 'all' ? placeholder : option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task list + detail panel */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
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