import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getTaskDetail } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function TaskDetail({ task, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTaskDetail(task.id);
      setDetail(res.data || task);
    } catch (err) {
      setError(err.message || 'Failed to load task detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const data = detail || task;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-950 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Task Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <LoadingSpinner label="Loading task..." />}
        {error && <ErrorMessage message={error} onRetry={loadDetail} />}

        {!loading && !error && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-slate-100">
                {data.title || `Task #${data.id}`}
              </h3>
              {data.description && (
                <p className="mt-1 text-sm text-slate-400">{data.description}</p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="text-slate-200">{data.status || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="text-slate-200">{data.type || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="text-slate-200">{data.source || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Assignee</dt>
                <dd className="text-slate-200">{data.assignee || '—'}</dd>
              </div>
              {data.confidence !== undefined && (
                <div>
                  <dt className="text-slate-500">Confidence</dt>
                  <dd className="text-slate-200">{data.confidence}</dd>
                </div>
              )}
              {data.created_at && (
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-200">
                    {new Date(data.created_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
