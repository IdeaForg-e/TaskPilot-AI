import TaskCard from './TaskCard';
import EmptyState from '../common/EmptyState';

export default function TaskList({ tasks = [], onSelectTask, selectedTaskId, isDetailOpen }) {
  if (tasks.length === 0) {
    return <EmptyState message="No tasks match the current filters." />;
  }

  const gridClass = isDetailOpen
    ? "grid grid-cols-1 gap-3 xl:grid-cols-2"
    : "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={gridClass}>
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onClick={() => onSelectTask(task)} 
          selected={selectedTaskId === task.id}
        />
      ))}
    </div>
  );
}
