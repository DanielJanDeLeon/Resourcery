import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const SEVERITY_STYLES = {
  minor:    'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe:   'bg-red-100 text-red-700',
};

const DamageReports = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    djangoApi.get('/damage-reports')
      .then(({ data }) => setReports(data))
      .catch(() => setError('Failed to load damage reports.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Damage Reports" subtitle={isAdmin ? 'All filed damage reports' : 'Damage reports on your bookings'}>
      {loading && (
        <div className="flex items-center justify-center py-32 text-white gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading…
        </div>
      )}
      {!loading && error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
      )}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-bold text-gray-800">Damage Reports</h2>
            <span className="ml-auto text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
              {reports.length} total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[...(isAdmin ? ['MEMBER'] : []), 'RESOURCE', 'SEVERITY', 'DESCRIPTION', 'DATE'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">No damage reports.</td></tr>
              ) : reports.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {isAdmin && <td className="px-6 py-4 font-medium text-gray-800">{r.username}</td>}
                  <td className="px-6 py-4 text-gray-700">{r.resource_name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || 'bg-gray-100 text-gray-600'}`}>
                      {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{r.description}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{r.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default DamageReports;
