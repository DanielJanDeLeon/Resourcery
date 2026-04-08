import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Boxes, CalendarDays, Activity, CheckCircle, Hourglass, History, ClipboardCheck, UserPlus, PlusCircle } from 'lucide-react';
import Layout from '../layout/Layout';
import { RESOURCE_TYPES } from './Resources';
import phpApi from '../config/phpApi';
import djangoApi from '../config/djangoApi';
import api from '../config/axios';
import { useAuth } from '../hooks/useAuth';

const getTypeInfo = (type) =>
  RESOURCE_TYPES.find(t => t.value === type) || RESOURCE_TYPES[RESOURCE_TYPES.length - 1];

const ViewAllBtn = ({ to }) => (
  <Link to={to}
    className="text-sm font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-all"
    style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
    View All
  </Link>
);

const StatCard = ({ icon: Icon, iconBg, value, label }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5">
    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: iconBg }}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-3xl font-extrabold text-gray-800">{value}</p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
    </div>
  </div>
);

const STATUS_COLORS = {
  available:          'bg-green-100 text-green-700',
  'under maintenance':'bg-red-100 text-red-700',
};

const BOOKING_STATUS_STYLE = {
  pending:      'bg-amber-100 text-amber-700',
  for_pickup:   'bg-orange-100 text-orange-700',
  declined:     'bg-red-100 text-red-700',
  returned:     'bg-green-100 text-green-700',
  not_returned: 'bg-orange-100 text-orange-700',
  cancelled:    'bg-gray-100 text-gray-500',
};

const BOOKING_STATUS_LABEL = {
  pending:      'Pending',
  for_pickup:   'For Pick Up',
  not_returned: 'Not Returned',
  returned:     'Returned',
  declined:     'Declined',
  cancelled:    'Cancelled',
};

// ── Booking Chart ─────────────────────────────────────────────────────────────
const BookingChart = ({ bookings }) => {
  if (!bookings.length) return null;

  // Count bookings per resource
  const counts = {};
  bookings.forEach(b => {
    counts[b.resource_name] = (counts[b.resource_name] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // top 6

  const max = sorted[0]?.[1] || 1;

  const BAR_COLORS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    '#FF8C42',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-5">Most Booked Resources</h2>
      <div className="flex flex-col gap-3">
        {sorted.map(([name, count], i) => (
          <div key={name} className="flex items-center gap-3">
            <p className="text-sm text-gray-700 font-medium w-36 truncate flex-shrink-0">{name}</p>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-5 rounded-full transition-all duration-500"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: BAR_COLORS[i % BAR_COLORS.length],
                  minWidth: 24,
                }}
              />
            </div>
            <span className="text-sm font-bold text-gray-600 w-6 text-right flex-shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, iconBg, title, btnLabel, btnTo, btnColor }) => (
  <Link to={btnTo}
    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all group">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: iconBg }}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="flex-1 font-semibold text-gray-800 text-sm">{title}</p>
    <span className="text-xs font-semibold px-3 py-1 rounded-full text-white flex-shrink-0"
      style={{ background: btnColor || 'linear-gradient(135deg,#667eea,#764ba2)' }}>
      {btnLabel}
    </span>
  </Link>
);

// ── Admin Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = ({ resources, bookings, memberCount }) => {
  const pending = bookings.filter(b => b.status === 'pending').length;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard icon={Users}        iconBg="linear-gradient(135deg,#667eea,#764ba2)" value={memberCount}      label="Total Members" />
        <StatCard icon={Boxes}        iconBg="linear-gradient(135deg,#f093fb,#f5576c)" value={resources.length} label="Total Resources" />
        <StatCard icon={CalendarDays} iconBg="linear-gradient(135deg,#4facfe,#00f2fe)" value={today}            label="Today's Date" />
        <StatCard icon={Activity}     iconBg="linear-gradient(135deg,#43e97b,#38f9d7)" value={pending}          label="Pending Bookings" />
      </div>

      {/* Booking chart */}
      <BookingChart bookings={bookings} />

      {/* Feature cards */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <FeatureCard icon={Boxes}         iconBg="linear-gradient(135deg,#f093fb,#f5576c)" title="Resources"       btnLabel="Open" btnTo="/resources"        btnColor="#FF8C42" />
          <FeatureCard icon={Users}         iconBg="linear-gradient(135deg,#667eea,#764ba2)" title="Members"         btnLabel="Open" btnTo="/members" />
          <FeatureCard icon={ClipboardCheck}iconBg="linear-gradient(135deg,#43e97b,#38f9d7)" title="Manage Bookings" btnLabel="Open" btnTo="/bookings/manage"  btnColor="linear-gradient(135deg,#43e97b,#38f9d7)" />
          <FeatureCard icon={History}       iconBg="linear-gradient(135deg,#4facfe,#00f2fe)" title="Booking History" btnLabel="Open" btnTo="/bookings/history" />
          <FeatureCard icon={UserPlus}      iconBg="linear-gradient(135deg,#667eea,#764ba2)" title="Add Member"      btnLabel="Add"  btnTo="/members/add" />
          <FeatureCard icon={PlusCircle}    iconBg="#FF8C42"                                 title="Add Resource"    btnLabel="Add"  btnTo="/resources/add"    btnColor="#FF8C42" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Resources */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Recent Resources</h2>
            <ViewAllBtn to="/resources" />
          </div>
          {resources.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No resources found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {resources.slice(0, 5).map(r => {
                const { Icon, color } = getTypeInfo(r.type);
                return (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                        <p className="text-gray-400 text-xs">{r.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[r.status] || STATUS_COLORS.available}`}>
                      {r.status === 'under maintenance' ? 'Unavailable' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking History */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Booking History</h2>
            <ViewAllBtn to="/bookings/all" />
          </div>
          {bookings.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No bookings yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{b.resource_name}</p>
                      <p className="text-gray-400 text-xs">{b.username} · {b.date}{b.return_date ? ` – ${b.return_date}` : ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BOOKING_STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                    {BOOKING_STATUS_LABEL[b.status] || b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Resident Dashboard ────────────────────────────────────────────────────────
const ResidentDashboard = ({ resources, myBookings }) => {
  const upcoming = myBookings.filter(b => b.status === 'for_pickup');
  const pending  = myBookings.filter(b => b.status === 'pending');
  const activeBookings  = myBookings.filter(b => ['pending', 'for_pickup', 'not_returned'].includes(b.status));
  const historyBookings = myBookings.filter(b => ['declined', 'returned', 'cancelled'].includes(b.status));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard icon={CheckCircle} iconBg="linear-gradient(135deg,#43e97b,#38f9d7)" value={upcoming.length} label="For Pick Up" />
        <StatCard icon={Hourglass}   iconBg="linear-gradient(135deg,#f093fb,#f5576c)" value={pending.length}  label="Pending Approval" />
        <StatCard icon={Boxes}       iconBg="linear-gradient(135deg,#4facfe,#00f2fe)" value={resources.length} label="Available Resources" />
        <StatCard icon={CalendarDays}iconBg="linear-gradient(135deg,#667eea,#764ba2)" value={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} label={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          {/* Active Bookings */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">My Bookings</h2>
              <ViewAllBtn to="/bookings/all" />
            </div>
            {activeBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No active bookings.</p>
                <Link to="/resources" className="text-sm font-semibold text-white px-5 py-2 rounded-full hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                  Browse Resources
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeBookings.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{b.resource_name}</p>
                        <p className="text-gray-400 text-xs">{b.date}{b.return_date ? ` – ${b.return_date}` : ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BOOKING_STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {BOOKING_STATUS_LABEL[b.status] || b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking History */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" /> Booking History
              </h2>
              <ViewAllBtn to="/bookings/all" />
            </div>
            {historyBookings.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No past bookings.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyBookings.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gray-300">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{b.resource_name}</p>
                        <p className="text-gray-400 text-xs">{b.date}{b.return_date ? ` – ${b.return_date}` : ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${BOOKING_STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {BOOKING_STATUS_LABEL[b.status] || b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Resources */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Available Resources</h2>
            <Link to="/resources" className="text-sm font-semibold text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-all"
              style={{ background: '#FF8C42' }}>
              Book Now
            </Link>
          </div>
          {resources.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No resources available.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {resources.slice(0, 5).map(r => {
                const { Icon, color } = getTypeInfo(r.type);
                return (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                        <p className="text-gray-400 text-xs">{r.type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">Available</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [memberCount, setMemberCount] = useState('—');

  useEffect(() => {
    phpApi.get('/resources').then(({ data }) => setResources(data)).catch(() => {});
    if (isAdmin) {
      api.get('/api/auth/members').then(({ data }) => setMemberCount(data.length)).catch(() => {});
      djangoApi.get('/bookings/all').then(({ data }) => setBookings(data)).catch(() => {});
    } else {
      djangoApi.get('/bookings/my').then(({ data }) => setMyBookings(data)).catch(() => {});
    }
  }, [isAdmin]);

  const availableResources = resources.filter(r => r.status !== 'under maintenance');

  return (
    <Layout
      title={isAdmin ? `Welcome back, ${user?.username || ''}!` : 'Home'}
      subtitle={isAdmin ? "Here's what's happening today." : "Here's your activity at a glance."}>
      {isAdmin
        ? <AdminDashboard resources={resources} bookings={bookings} memberCount={memberCount} />
        : <ResidentDashboard resources={availableResources} myBookings={myBookings} />
      }
    </Layout>
  );
};

export default Dashboard;
