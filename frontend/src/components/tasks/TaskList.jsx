import TaskCard from './TaskCard';
import EmptyState from '../common/EmptyState';

export default function TaskList({ tasks = [], onSelectTask }) {
  if (tasks.length === 0) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onSelectTask(task)} />
      ))}
    </div>
  );
}
