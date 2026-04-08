import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Package, RotateCcw, AlertTriangle, X } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';

const STATUS_STYLES = {
  pending:      'bg-amber-100 text-amber-700',
  for_pickup:   'bg-orange-100 text-orange-700',
  not_returned: 'bg-red-100 text-red-700',
  returned:     'bg-green-100 text-green-700',
  declined:     'bg-gray-100 text-gray-500',
  cancelled:    'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  pending:      'Pending',
  for_pickup:   'For Pick Up',
  not_returned: 'Not Returned',
  returned:     'Returned',
  declined:     'Declined',
  cancelled:    'Cancelled',
};

const to12h = (t) => {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

// ── Damage Report Modal ───────────────────────────────────────────────────────
const DamageReportModal = ({ booking, onClose, onSubmitted }) => {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('minor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await djangoApi.post('/damage-reports/create', {
        booking_id: booking.id,
        resource_name: booking.resource_name,
        username: booking.username,
        description,
        severity,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report.');
    } finally { setLoading(false); }
  };

  const SEVERITY = [
    { value: 'minor',    label: 'Minor',    color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'moderate', label: 'Moderate', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'severe',   label: 'Severe',   color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800">File Damage Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">{booking.resource_name} · {booking.username}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <div className="flex gap-2">
              {SEVERITY.map(s => (
                <button key={s.value} type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-all ${severity === s.value ? s.color + ' border-current' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
              placeholder="Describe the damage…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all bg-red-500">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingRow = ({ booking, onStatusChange, onDamageReport }) => {
  const [updating, setUpdating] = useState(false);
  const [rowError, setRowError] = useState('');

  const update = async (newStatus) => {
    setUpdating(true);
    setRowError('');
    try {
      const { data } = await djangoApi.patch(`/bookings/${booking.id}/status`, { status: newStatus });
      onStatusChange(data);
    } catch (e) {
      setRowError(e.response?.data?.error || 'Action failed.');
    } finally { setUpdating(false); }
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-gray-500 text-sm">{booking.id}</td>
      <td className="px-6 py-4 font-medium text-gray-800 text-sm">{booking.resource_name}</td>
      <td className="px-6 py-4 text-gray-600 text-sm">{booking.username}</td>
      <td className="px-6 py-4 text-gray-600 text-sm">
        {booking.return_date ? `${booking.date} – ${booking.return_date}` : booking.date}
        {!booking.return_date && booking.end_time && (
          <span className="ml-1.5 text-gray-400">
            · {to12h(booking.time)}–{to12h(booking.end_time)}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600 text-sm">
        {booking.quantity_requested > 1 ? (
          <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs">{booking.quantity_requested}</span>
        ) : '—'}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </span>
          {booking.is_extension && booking.status === 'pending' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Extension
            </span>
          )}
          {booking.is_update && booking.status === 'pending' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Update
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* pending → approve (for_pickup) or decline */}
            {booking.status === 'pending' && (
              <>
                <button onClick={() => update('for_pickup')} disabled={updating}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => update('declined')} disabled={updating}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-all disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </button>
              </>
            )}
            {/* for_pickup → picked up (not_returned) */}
            {booking.status === 'for_pickup' && (
              <button onClick={() => update('not_returned')} disabled={updating}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50">
                <Package className="w-3.5 h-3.5" /> Mark as Picked Up
              </button>
            )}
            {/* not_returned → returned */}
            {booking.status === 'not_returned' && (
              <>
                <button onClick={() => update('returned')} disabled={updating}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-all disabled:opacity-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Returned
                </button>
                <button onClick={() => onDamageReport(booking)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-all">
                  <AlertTriangle className="w-3.5 h-3.5" /> Report Damage
                </button>
              </>
            )}
          </div>
          {rowError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 max-w-xs">{rowError}</p>
          )}
        </div>
      </td>
    </tr>
  );
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [damageTarget, setDamageTarget] = useState(null);

  useEffect(() => {
    djangoApi.get('/bookings/all')
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const active = bookings.filter(b => ['pending', 'for_pickup', 'not_returned'].includes(b.status));

  return (
    <>
      <Layout title="Manage Bookings" subtitle="Approve or decline pending requests and track returns">
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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Active Bookings</h2>
            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
              {active.length} active
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'RESOURCE', 'MEMBER', 'DATE', 'QTY', 'STATUS', 'ACTION'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">No active bookings.</td></tr>
              ) : active.map(b => (
                <BookingRow key={b.id} booking={b} onStatusChange={handleStatusChange} onDamageReport={setDamageTarget} />
              ))}
            </tbody>
          </table>        </div>
      )}
    </Layout>
      {damageTarget && (
        <DamageReportModal
          booking={damageTarget}
          onClose={() => setDamageTarget(null)}
          onSubmitted={() => setDamageTarget(null)}
        />
      )}
    </>
  );
};

export default ManageBookings;
