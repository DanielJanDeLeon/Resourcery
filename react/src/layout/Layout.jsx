import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, CalendarDays, ClipboardCheck,
  Users, UserPlus, PlusCircle, User, History, Menu, X as Close, Home,
  Bell, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import djangoApi from '../config/djangoApi';

const NAV = {
  MAIN: [
    { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard',       adminOnly: true },
    { to: '/dashboard',        icon: Home,            label: 'Home',            residentOnly: true },
    { to: '/resources',        icon: Boxes,           label: 'Resources' },
    { to: '/bookings/all',     icon: CalendarDays,    label: 'My Bookings',     residentOnly: true },
    { to: '/damage-reports',  icon: AlertTriangle,   label: 'Damage Reports',  residentOnly: true },
    { to: '/members',          icon: Users,           label: 'Members',         adminOnly: true },
    { to: '/bookings/history', icon: History,         label: 'Booking History', adminOnly: true },
    { to: '/damage-reports',  icon: AlertTriangle,   label: 'Damage Reports',  adminOnly: true },
  ],
  MANAGE: [
    { to: '/members/add',           icon: UserPlus,        label: 'Add Member',      adminOnly: true },
    { to: '/resources/add',         icon: PlusCircle,      label: 'Add Resource',    adminOnly: true },
    { to: '/bookings/manage',       icon: ClipboardCheck,  label: 'Manage Bookings', adminOnly: true },
  ],
  PROFILE: [
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

const STORAGE_VERSION = 'v2';
const STORAGE_VER_KEY = 'resourcery_notif_ver';
if (localStorage.getItem(STORAGE_VER_KEY) !== STORAGE_VERSION) {
  ['resourcery_seen_notifs', 'resourcery_cleared_notifs', 'resourcery_seen_notifs_admin', 'resourcery_cleared_notifs_admin'].forEach(k => localStorage.removeItem(k));
  localStorage.setItem(STORAGE_VER_KEY, STORAGE_VERSION);
}

const NOTIF_STYLES = {
  new_booking:       { icon: Bell,         color: 'text-amber-600',  bg: 'bg-amber-50',   label: 'New Booking Request' },
  booking_update:    { icon: CalendarDays, color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Update Request' },
  booking_extension: { icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50',  label: 'Extension Request' },
  booking_approved:  { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   label: 'For Pick Up' },
  booking_declined:  { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50',     label: 'Declined' },
  booking_cancelled: { icon: XCircle,      color: 'text-gray-500',   bg: 'bg-gray-50',    label: 'Cancelled' },
  booking_picked_up: { icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50',    label: 'Picked Up' },
  booking_no_pickup: { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     label: 'Failed to Pick Up' },
  booking_reminder:  { icon: Bell,         color: 'text-amber-600',  bg: 'bg-amber-50',   label: 'Pickup Reminder' },
  damage_report:     { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',     label: 'Damage Report Filed' },
};

// ── Notification Bell ─────────────────────────────────────────────────────────
const getNotifLink = (type, isAdmin) => {
  if (isAdmin) {
    if (['new_booking', 'booking_update', 'booking_extension', 'booking_cancelled'].includes(type))
      return '/bookings/manage';
    return '/bookings/history';
  }
  return '/bookings/all';
};

const NotificationBell = ({ isAdmin, username }) => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const clearedAtKey = `resourcery_cleared_at_${username || (isAdmin ? 'admin' : 'resident')}`;

  const fetchNotifs = async () => {
    try {
      const { data } = await djangoApi.get('/notifications');
      const clearedAt = localStorage.getItem(clearedAtKey);
      const filtered = clearedAt
        ? data.filter(n => new Date(n.created_at) > new Date(clearedAt))
        : data;
      setNotifs(filtered);
    } catch {}
  };

  useEffect(() => {
    if (!username && !isAdmin) return; // wait until username is known
    fetchNotifs();
    const id = setInterval(fetchNotifs, 20000);
    return () => clearInterval(id);
  }, [isAdmin, username]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.is_read);

  const handleOpen = async () => {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (nowOpen && unread.length > 0) {
      try {
        await djangoApi.patch('/notifications/read');
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch {}
    }
  };

  const handleClear = async () => {
    try {
      await djangoApi.delete('/notifications/clear');
      setNotifs([]);
      localStorage.setItem(clearedAtKey, new Date().toISOString());
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
        <Bell className="w-4 h-4" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ background: '#f5576c', fontSize: 10 }}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">Notifications</p>
            {notifs.length > 0 && (
              <button onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No notifications.</p>
            ) : (
              notifs.map(n => {
                const s = NOTIF_STYLES[n.type];
                if (!s) return null;
                const Icon = s.icon;
                const link = getNotifLink(n.type, isAdmin);
                return (
                  <div key={n.id}
                    onClick={() => { setOpen(false); navigate(link); }}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:brightness-95 transition-all ${s.bg} ${!n.is_read ? 'border-l-2 border-l-purple-400' : ''}`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{n.resource_name}</p>
                      {isAdmin ? (
                        <p className="text-xs text-gray-600 mt-0.5">
                          <span className="font-bold">{n.username}</span> · <span className={`font-bold ${s.color}`}>{s.label}</span>
                        </p>
                      ) : (
                        <p className={`text-xs font-bold ${s.color}`}>Booking {s.label}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{n.date}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NavLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
    style={active
      ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }
      : { color: '#6b7280' }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(102,126,234,0.08)'; e.currentTarget.style.color = '#667eea'; e.currentTarget.style.transform = 'translateX(4px)'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.transform = ''; }}}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    {label}
  </Link>
);

const SIDEBAR_WIDTH = 280;

const Layout = ({ title, subtitle, children }) => {
  const { isAdmin, logout, user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Wave background */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0 overflow-hidden" style={{ height: 160 }}>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute bottom-0 w-full" style={{ opacity: 0.12 }} fill="white">
          <path d="M0,80 C360,160 1080,0 1440,80 L1440,160 L0,160 Z" />
        </svg>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute bottom-0 w-full" style={{ opacity: 0.07 }} fill="white">
          <path d="M0,100 C480,20 960,140 1440,60 L1440,160 L0,160 Z" />
        </svg>
      </div>

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full bg-white z-20 flex flex-col transition-all duration-300 ease-in-out"
        style={{ width: open ? SIDEBAR_WIDTH : 0, overflow: 'hidden', boxShadow: open ? '4px 0 20px rgba(0,0,0,0.08)' : 'none' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0" style={{ minWidth: SIDEBAR_WIDTH }}>
          <div className="flex items-center gap-3">
            <img src="/resourcery-logo.png" alt="Resourcery" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            <div className="w-9 h-9 rounded-full items-center justify-center text-white font-bold text-base flex-shrink-0 hidden"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>R</div>
            <span className="text-xl font-bold whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Resourcery
            </span>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0">
            <Close className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6" style={{ minWidth: SIDEBAR_WIDTH }}>
          {Object.entries(NAV).map(([section, links]) => {
            const visible = links.filter(l => (!l.adminOnly || isAdmin) && (!l.residentOnly || !isAdmin));
            if (!visible.length) return null;
            return (
              <div key={section}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">{section}</p>
                <div className="space-y-1">
                  {visible.map(link => (
                    <NavLink key={link.to} {...link} active={pathname === link.to} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="relative z-10 transition-all duration-300 ease-in-out" style={{ marginLeft: open ? SIDEBAR_WIDTH : 0 }}>
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(o => !o)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors flex-shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold leading-tight"
                style={{ fontSize: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {title}
              </h1>
              {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell isAdmin={isAdmin} username={user?.username} />
            <Link to="/profile"
              className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
              <User className="w-4 h-4" />
            </Link>
            <button onClick={logout}
              className="px-5 py-2 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#FF8C42' }}>
              Logout
            </button>
          </div>
        </header>

        <main className="p-8 min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
