import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import JobDetailModal from './JobDetailModal';
import { jobApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { formatDateTime } from '../utils/formatters';

export default function Jobs() {
  const { user } = useAuth();
  const { socket } = useRealtime();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState(null);
  const [highlighted, setHighlighted] = useState(new Set());

  const godownCodes = (user?.assignedGodowns || []).map((g) => g.code);
  const tabs = godownCodes.length > 0 ? godownCodes : ['ALL'];

  async function load(tab = activeTab) {
    setLoading(true);
    setError('');
    try {
      const data = tab === 'ALL' ? await jobApi.listAll() : (await jobApi.listForGodown(tab)).jobs;
      setJobs(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(activeTab); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return undefined;
    const onNotif = (n) => {
      if (['NEW_DC', 'JOB_STATUS', 'ROLLS_CREATED'].includes(n.type)) {
        if (n.payload?.jobId) setHighlighted((s) => new Set(s).add(n.payload.jobId));
        load(activeTab);
      }
    };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [socket, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && jobs.length === 0) return <Loader label="Loading godown jobs…" />;
  if (error) return <ErrorState message={error} onRetry={() => load(activeTab)} />;

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Godown Jobs</h1>
          <p className="text-muted">Jobs created automatically from synced Delivery Challans.</p>
        </div>
      </div>

      {tabs.length > 1 || tabs[0] !== 'ALL' ? (
        <div className="pill-tabs">
          {godownCodes.length > 0 && tabs.map((t) => (
            <button key={t} className={`pill-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
          {godownCodes.length === 0 && (
            <button className="pill-tab active">All Godowns</button>
          )}
        </div>
      ) : null}

      <Card>
        {jobs.length === 0 ? (
          <EmptyState icon="📦" title="No jobs yet" message="New Delivery Challans synced from System 1 will appear here automatically." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>DC No.</th><th>Bill To</th><th>Godown</th><th>Items</th><th>Status</th><th>Updated</th><th></th></tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className={job.isNew_ || highlighted.has(job._id) ? 'row-new' : ''}>
                    <td className="mono">{job.dc?.dcNumber}</td>
                    <td>{job.dc?.billTo}</td>
                    <td><span className="badge badge-neutral">{job.godown?.code}</span></td>
                    <td className="text-muted">{job.items?.length || 0} item(s)</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td className="text-muted">{formatDateTime(job.updatedAt)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(job)}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onChanged={() => load(activeTab)}
        />
      )}
    </div>
  );
}
