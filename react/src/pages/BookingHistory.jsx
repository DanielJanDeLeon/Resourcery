import { useEffect, useState } from 'react';
import { Loader2, History, Search, Download } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';

const STATUS_STYLES = {
  returned:  'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_pickup: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  returned:  'Returned',
  declined:  'Declined',
  cancelled: 'Cancelled',
  no_pickup: 'No Pick Up',
};

const HISTORY_STATUSES = ['returned', 'declined', 'cancelled', 'no_pickup'];

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    djangoApi.get('/bookings/all')
      .then(({ data }) => setBookings(data.filter(b => HISTORY_STATUSES.includes(b.status))))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    const matchSearch = b.resource_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.username?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const downloadCSV = () => {
    const headers = ['#', 'Resource', 'Member', 'Date', 'Status'];
    const rows = filtered.map(b => [
      b.id,
      b.resource_name,
      b.username,
      b.return_date ? `${b.date} - ${b.return_date}` : b.date,
      STATUS_LABELS[b.status] || b.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Booking History" subtitle="Completed and declined bookings">
      {loading && (
        <div className="flex items-center justify-center py-32 text-white gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading…
        </div>
      )}
      {!loading && error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
      )}
      {!loading && !error && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search resource or member..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm">
              <option value="all">All Statuses</option>
              {HISTORY_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            {filtered.length > 0 && (
              <button onClick={downloadCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                <Download className="w-4 h-4" /> Download CSV
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-800">History</h2>
              <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {filtered.length} records
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'RESOURCE', 'MEMBER', 'DATE', 'STATUS'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-12">No history found.</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{b.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{b.resource_name}</td>
                    <td className="px-6 py-4 text-gray-600">{b.username}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {b.return_date ? `${b.date} – ${b.return_date}` : b.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
};

export default BookingHistory;
