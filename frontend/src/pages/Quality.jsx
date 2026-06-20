import { useEffect, useState } from 'react';
import { getQualityReports } from '../services/api';
import QualityReport from '../components/quality/QualityReport';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function Quality() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQualityReports();
      setReports(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load quality reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) return <LoadingSpinner label="Loading quality reports..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReports} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-100">Quality</h1>
      <QualityReport reports={reports} />
    </div>
  );
}
