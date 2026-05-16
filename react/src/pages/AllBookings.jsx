import React, { useEffect, useState } from 'react';
import { Loader2, X, CalendarDays, Download } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const STATUS = {
  pending:          'bg-amber-100 text-amber-700',
  for_pickup:       'bg-orange-100 text-orange-700',
  not_returned:     'bg-red-100 text-red-700',
  under_inspection: 'bg-blue-100 text-blue-700',
  declined:         'bg-red-100 text-red-700',
  returned:         'bg-green-100 text-green-700',
  cancelled:        'bg-gray-100 text-gray-500',
  no_pickup:        'bg-red-100 text-red-700',
};

const statusLabel = (s) => ({
  pending:          'Pending',
  for_pickup:       'For Pick Up',
  not_returned:     'Not Returned',
  under_inspection: 'Under Inspection',
  declined:         'Declined',
  returned:         'Returned',
  cancelled:        'Cancelled',
  no_pickup:        'No Pick Up',
}[s] || s);

const ACTIVE_STATUSES  = ['pending', 'for_pickup', 'not_returned', 'under_inspection'];
const HISTORY_STATUSES = ['declined', 'returned', 'cancelled', 'no_pickup'];

const fmt = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

// ── Extension Modal ───────────────────────────────────────────────────────────
const ExtensionModal = ({ booking, onClose, onSuccess }) => {
  const [newReturnDate, setNewReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const submit = async () => {
    if (!newReturnDate) return;
    setLoading(true); setError('');
    try {
      await djangoApi.patch(`/bookings/${booking.id}/extend`, {
        merged_start: booking.date,
        merged_end: newReturnDate,
        is_extension: true,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Extension request failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Request Extension</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm border border-gray-100">
          <p className="font-semibold text-gray-800">{booking.resource_name}</p>
          <p className="text-gray-500 text-xs mt-0.5">Current: {booking.date}{booking.return_date ? ` – ${booking.return_date}` : ''}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Return Date</label>
          <input type="date" value={newReturnDate}
            min={booking.return_date || booking.date || today}
            onChange={e => setNewReturnDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
        </div>
        {newReturnDate && (
          <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 mb-4">
            <CalendarDays className="w-3.5 h-3.5" />
            Extended to: {fmt(booking.date)} – {fmt(newReturnDate)}
          </div>
        )}
        {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={submit} disabled={!newReturnDate || loading}
            className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
            style={{ background: '#FF8C42' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Extension'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Booking Table ─────────────────────────────────────────────────────────────
const BookingTable = ({ bookings, emptyMsg, showId = false, onCancel, onCancelExtension, onExtend }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-100">
        {[...(showId ? ['#'] : []), 'RESOURCE', 'DATE', 'STATUS', ...(onCancel || onCancelExtension || onExtend ? ['ACTION'] : [])].map(h => (
          <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {bookings.length === 0 ? (
        <tr><td colSpan={showId ? 5 : 4} className="text-center text-gray-400 py-12">{emptyMsg}</td></tr>
      ) : bookings.map(b => (
        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
          {showId && <td className="px-6 py-4 text-gray-500">{b.id}</td>}
          <td className="px-6 py-4 font-medium text-gray-800">{b.resource_name}</td>
          <td className="px-6 py-4 text-gray-600">
            {b.return_date ? `${b.date} – ${b.return_date}` : b.date}
          </td>
          <td className="px-6 py-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS[b.status] || 'bg-gray-100 text-gray-600'}`}>
              {statusLabel(b.status)}
            </span>
          </td>
          {(onCancel || onExtend) && (
            <td className="px-6 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                {onCancel && ['pending', 'for_pickup'].includes(b.status) && (
                  b.status === 'pending' && b.is_extension
                    ? <button onClick={() => onCancelExtension(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all border border-orange-200">
                        <X className="w-3 h-3" /> Cancel Extension
                      </button>
                    : <button onClick={() => onCancel(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                )}
                {onExtend && b.status === 'not_returned' && (
                  <button onClick={() => onExtend(b)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all border border-purple-200">
                    <CalendarDays className="w-3 h-3" /> Request Extension
                  </button>
                )}
              </div>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

// ── AllBookings Page ──────────────────────────────────────────────────────────
const AllBookings = () => {
  const { isAdmin } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extendTarget, setExtendTarget] = useState(null);

  const fetchBookings = () => {
    const url = isAdmin ? '/bookings/all' : '/bookings/my';
    djangoApi.get(url)
      .then(({ data }) => setAllBookings(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    // Re-fetch when tab becomes visible (e.g. after admin action in another tab)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchBookings(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isAdmin]);

  const active  = allBookings.filter(b => ACTIVE_STATUSES.includes(b.status));
  const history = allBookings.filter(b => HISTORY_STATUSES.includes(b.status));

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const { data } = await djangoApi.patch(`/bookings/${id}/cancel`);
      setAllBookings(prev => prev.map(b => b.id === data.id ? data : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  const handleCancelExtension = async (id) => {
    if (!window.confirm('Cancel the extension request? The booking will revert to Not Returned.')) return;
    try {
      const { data } = await djangoApi.patch(`/bookings/${id}/cancel-extension`);
      setAllBookings(prev => prev.map(b => b.id === data.id ? data : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel extension.');
    }
  };

  const downloadCSV = (bookingList, filename) => {
    const headers = ['Resource', 'Date', 'Status'];
    const rows = bookingList.map(b => [
      b.resource_name,
      b.return_date ? `${b.date} - ${b.return_date}` : b.date,
      statusLabel(b.status),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="My Bookings" subtitle="Your current active bookings">
      {loading && (
        <div className="flex items-center justify-center py-32 text-white gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading…
        </div>
      )}
      {!loading && error && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden sa">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Active Bookings</h2>
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                {active.length} active
              </span>
            </div>
            <BookingTable
              bookings={active}
              emptyMsg="No active bookings."
              showId={isAdmin}
              onCancel={!isAdmin ? handleCancel : undefined}
              onCancelExtension={!isAdmin ? handleCancelExtension : undefined}
              onExtend={!isAdmin ? setExtendTarget : undefined}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden sa">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Booking History</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {history.length} total
                </span>
                {history.length > 0 && (
                  <button onClick={() => downloadCSV(history, 'my-booking-history')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                )}
              </div>
            </div>
            <BookingTable bookings={history} emptyMsg="No booking history yet." showId={isAdmin} />
          </div>
        </div>
      )}

      {extendTarget && (
        <ExtensionModal
          booking={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSuccess={fetchBookings}
        />
      )}
    </Layout>
  );
};

export default AllBookings;
