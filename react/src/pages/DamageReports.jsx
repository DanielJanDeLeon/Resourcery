import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle, History, X } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const SEVERITY_STYLES = {
  minor:    'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe:   'bg-red-100 text-red-700',
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ report, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Damage Report Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">{report.resource_name} · {report.created_at?.slice(0, 10)}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Member</p>
            <p className="text-sm font-medium text-gray-800">{report.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Severity</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${SEVERITY_STYLES[report.severity] || 'bg-gray-100 text-gray-600'}`}>
              {report.severity?.charAt(0).toUpperCase() + report.severity?.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quantity Damaged</p>
            <p className="text-sm font-medium text-gray-800">{report.quantity_damaged ?? 1}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reported By</p>
            <p className="text-sm font-medium text-gray-800">{report.reported_by}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            {report.description}
          </p>
        </div>
        {report.resolved && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Resolved</p>
            <p className="text-sm text-gray-700">By <span className="font-medium">{report.resolved_by}</span> on {report.resolved_at?.slice(0, 10)}</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-5">
        <button onClick={onClose}
          className="w-full py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── DamageReports Page ────────────────────────────────────────────────────────
const DamageReports = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    djangoApi.get('/damage-reports')
      .then(({ data }) => setReports(data))
      .catch(() => setError('Failed to load damage reports.'))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this damage report as resolved? The resource will be made available again if no other active damage reports exist.')) return;
    setResolving(id);
    try {
      const { data } = await djangoApi.patch(`/damage-reports/${id}/resolve`);
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve report.');
    } finally {
      setResolving(null);
    }
  };

  const active   = reports.filter(r => !r.resolved);
  const resolved = reports.filter(r => r.resolved);

  const headers = isAdmin
    ? ['MEMBER', 'RESOURCE', 'QTY', 'SEVERITY', 'DESCRIPTION', 'DATE', 'ACTION']
    : ['RESOURCE', 'SEVERITY', 'DESCRIPTION', 'DATE'];

  const historyHeaders = isAdmin
    ? ['MEMBER', 'RESOURCE', 'QTY', 'SEVERITY', 'DESCRIPTION', 'REPORTED', 'RESOLVED BY']
    : ['RESOURCE', 'SEVERITY', 'DESCRIPTION', 'DATE'];

  return (
    <Layout title="Damage Reports" subtitle={isAdmin ? 'All filed damage reports' : 'Damage reports on your bookings'}>
      {loading && (
        <div className="flex items-center justify-center py-32 text-gray-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading…
        </div>
      )}
      {!loading && error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-6">

          {/* Active damage reports */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden sa">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="font-bold text-gray-800">Active Damage Reports</h2>
              <span className="ml-auto text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
                {active.length} active
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {headers.map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.length === 0 ? (
                  <tr><td colSpan={headers.length} className="text-center text-gray-400 py-12">No active damage reports.</td></tr>
                ) : active.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    {isAdmin && <td className="px-6 py-4 font-medium text-gray-800">{r.username}</td>}
                    <td className="px-6 py-4 text-gray-700">{r.resource_name}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-gray-600">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {r.quantity_damaged ?? 1}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || 'bg-gray-100 text-gray-600'}`}>
                        {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{r.description}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{r.created_at?.slice(0, 10)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleResolve(r.id)}
                          disabled={resolving === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all disabled:opacity-50"
                        >
                          {resolving === r.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle className="w-3.5 h-3.5" />
                          }
                          Resolved
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Damage history */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden sa">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-800">Damage History</h2>
              <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {resolved.length} resolved
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {historyHeaders.map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolved.length === 0 ? (
                  <tr><td colSpan={historyHeaders.length} className="text-center text-gray-400 py-12">No resolved damage reports yet.</td></tr>
                ) : resolved.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    {isAdmin && <td className="px-6 py-4 font-medium text-gray-800">{r.username}</td>}
                    <td className="px-6 py-4 text-gray-700">{r.resource_name}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-gray-600">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {r.quantity_damaged ?? 1}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || 'bg-gray-100 text-gray-600'}`}>
                        {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{r.description}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{r.created_at?.slice(0, 10)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        <span className="font-medium text-gray-700">{r.resolved_by}</span>
                        {r.resolved_at && <span className="block text-gray-400">{r.resolved_at.slice(0, 10)}</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {selected && <DetailModal report={selected} onClose={() => setSelected(null)} />}
    </Layout>
  );
};

export default DamageReports;
