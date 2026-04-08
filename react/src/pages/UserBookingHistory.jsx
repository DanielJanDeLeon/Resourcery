import React, { useEffect, useState } from 'react';
import { Loader2, History } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const STATUS = {
  returned: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};

const UserBookingHistory = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = isAdmin ? '/bookings/all' : '/bookings/my';
    djangoApi.get(url)
      .then(({ data }) => setBookings(data.filter(b => ['returned', 'declined'].includes(b.status))))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  return (
    <Layout title="Booking History" subtitle="Your completed and declined bookings">
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
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-800">Booking History</h2>
            <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {bookings.length} records
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'RESOURCE', 'DATE', 'STATUS'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-400 py-12">No booking history yet.</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{b.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{b.resource_name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {b.return_date ? `${b.date} – ${b.return_date}` : b.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default UserBookingHistory;
