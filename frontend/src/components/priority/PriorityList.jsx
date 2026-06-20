import PriorityCard from './PriorityCard';
import EmptyState from '../common/EmptyState';

export default function PriorityList({ tasks = [] }) {
  if (tasks.length === 0) {
    return <EmptyState message="No ranked tasks available." />;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, i) => (
        <PriorityCard key={task.id} task={task} rank={i + 1} />
      ))}
    </div>
  );
}
