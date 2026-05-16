import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, X, CalendarDays } from 'lucide-react';
import Layout from '../layout/Layout';
import api from '../config/axios';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const ROLE_COLORS = {
  ROLE_ADMIN: 'bg-purple-100 text-purple-700',
  ROLE_USER:  'bg-green-100 text-green-700',
};

const ROLE_LABELS = {
  ROLE_ADMIN: 'Admin',
  ROLE_USER:  'Resident',
};

const STATUS_STYLES = {
  pending:      'bg-amber-100 text-amber-700',
  for_pickup:   'bg-blue-100 text-blue-700',
  not_returned: 'bg-red-100 text-red-700',
  returned:     'bg-green-100 text-green-700',
  declined:     'bg-red-100 text-red-700',
  cancelled:    'bg-gray-100 text-gray-500',
  no_pickup:    'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  pending: 'Pending', for_pickup: 'For Pick Up', not_returned: 'Not Returned',
  returned: 'Returned', declined: 'Declined', cancelled: 'Cancelled', no_pickup: 'No Pick Up',
};

const MemberModal = ({ member, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    djangoApi.get('/bookings/all')
      .then(({ data }) => setBookings(data.filter(b => b.username === member.username)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [member.username]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">{member.username}</p>
            <p className="text-xs text-gray-400">{member.email || 'No email'} · {ROLE_LABELS[member.role]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No bookings found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['RESOURCE', 'DATE', 'STATUS'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{b.resource_name}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {b.return_date ? `${b.date} – ${b.return_date}` : b.date}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const Members = () => {
  const { user, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    api.get('/api/auth/members').then(({ data }) => setMembers(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(m =>
    (m.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete ${username}? Their active bookings will also be removed.`)) return;
    try {
      await djangoApi.delete(`/bookings/user/${username}`);
      await api.delete(`/api/auth/members/${id}`);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  return (
    <>
      <Layout title="Members" subtitle="All registered users in the system">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-gray-800 font-semibold text-lg">All Members ({filtered.length})</h2>
        {isAdmin && (
          <Link to="/members/add"
            className="px-4 py-2 text-sm text-white font-semibold rounded-full hover:opacity-90 transition-all"
            style={{ background: '#FF8C42' }}>
            + Add Member
          </Link>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search members by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden sa">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'FULL NAME', 'EMAIL', 'ROLE', 'ACTION'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">No members found.</td></tr>
              ) : filtered.map((m, i) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    <button onClick={() => setSelectedMember(m)}
                      className="hover:text-purple-600 hover:underline transition-colors text-left">
                      {m.username}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{m.email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLORS[m.role] || ROLE_COLORS.ROLE_USER}`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin && m.username !== user?.username ? (
                      <button onClick={() => handleDelete(m.id, m.username)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                        Delete
                      </button>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
      {selectedMember && <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </>
  );
};

export default Members;
