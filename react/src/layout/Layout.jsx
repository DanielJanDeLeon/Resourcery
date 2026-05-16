import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, CalendarDays, ClipboardCheck,
  Users, UserPlus, PlusCircle, User, History, Home,
  Bell, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
  LogOut, Settings, FileText, Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import djangoApi from '../config/djangoApi';

// ── Navigation config ─────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',     adminOnly: true },
      { to: '/dashboard', icon: Home,            label: 'Home',          residentOnly: true },
      { to: '/resources', icon: Boxes,           label: 'Resources' },
    ],
  },
  {
    label: 'Bookings',
    items: [
      { to: '/bookings/all',     icon: CalendarDays,  label: 'My Bookings',     residentOnly: true },
      { to: '/bookings/manage',  icon: ClipboardCheck,label: 'Manage Bookings', adminOnly: true },
      { to: '/bookings/history', icon: History,       label: 'Booking History', adminOnly: true },
      { to: '/damage-reports',   icon: AlertTriangle, label: 'Damage Reports' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/members',     icon: Users,    label: 'Members',    adminOnly: true },
      { to: '/members/add', icon: UserPlus, label: 'Add Member', adminOnly: true },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/resources/add', icon: PlusCircle, label: 'Add Resource', adminOnly: true },
    ],
  },
  {
    label: 'Legal',
    items: [
      { to: '/terms',         icon: FileText, label: 'Terms & Conditions', adminOnly: true },
      { to: '/privacy-admin', icon: Shield,   label: 'Privacy Policy',     adminOnly: true },
    ],
  },
];

// Bottom navigation items for residents (Legal section)
const BOTTOM_NAV_ITEMS = [
  { to: '/terms-view', icon: FileText, label: 'Terms & Conditions', residentOnly: true },
  { to: '/privacy-view', icon: Shield, label: 'Privacy Policy', residentOnly: true },
];

// ── Notification Bell ─────────────────────────────────────────────────────────
const STORAGE_VERSION = 'v3';
const STORAGE_VER_KEY = 'resourcery_notif_ver';
if (localStorage.getItem(STORAGE_VER_KEY) !== STORAGE_VERSION) {
  ['resourcery_seen_notifs','resourcery_cleared_notifs','resourcery_seen_notifs_admin','resourcery_cleared_notifs_admin']
    .forEach(k => localStorage.removeItem(k));
  localStorage.setItem(STORAGE_VER_KEY, STORAGE_VERSION);
}

const NOTIF_STYLES = {
  new_booking:       { icon: Bell,          color: '#f59e0b', label: 'New Booking' },
  booking_update:    { icon: CalendarDays,  color: '#3b82f6', label: 'Update Request' },
  booking_extension: { icon: CalendarDays,  color: '#8b5cf6', label: 'Extension Request' },
  booking_approved:  { icon: CheckCircle,   color: '#10b981', label: 'For Pick Up' },
  booking_declined:  { icon: XCircle,       color: '#ef4444', label: 'Declined' },
  booking_cancelled: { icon: XCircle,       color: '#6b7280', label: 'Cancelled' },
  booking_picked_up: { icon: CheckCircle,   color: '#3b82f6', label: 'Picked Up' },
  booking_no_pickup: { icon: XCircle,       color: '#ef4444', label: 'Failed to Pick Up' },
  booking_reminder:  { icon: Bell,          color: '#f59e0b', label: 'Pickup Reminder' },
  damage_report:     { icon: AlertTriangle, color: '#ef4444', label: 'Damage Report' },
};

const getNotifLink = (type, isAdmin) => {
  if (isAdmin) return ['new_booking','booking_update','booking_extension','booking_cancelled'].includes(type)
    ? '/bookings/manage' : '/bookings/history';
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
      setNotifs(clearedAt ? data.filter(n => new Date(n.created_at) > new Date(clearedAt)) : data);
    } catch {}
  };

  useEffect(() => {
    if (!username && !isAdmin) return;
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
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">Notifications</p>
            {notifs.length > 0 && (
              <button onClick={handleClear} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No notifications.</p>
            ) : notifs.map(n => {
              const s = NOTIF_STYLES[n.type];
              if (!s) return null;
              const Icon = s.icon;
              return (
                <div key={n.id}
                  onClick={() => { setOpen(false); navigate(getNotifLink(n.type, isAdmin)); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-purple-50/50' : ''}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: s.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{n.resource_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isAdmin ? <><span className="font-medium">{n.username}</span> · </> : ''}{s.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.date}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
const Layout = ({ title, subtitle, children }) => {
  const { isAdmin, logout, user } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const mainRef = useRef(null);

  // Scroll-triggered animations
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sa-in');
          } else {
            entry.target.classList.remove('sa-in');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px', root: container }
    );

    const observeAll = () => {
      container.querySelectorAll('.sa, .sa-left, .sa-right, .sa-scale').forEach(el => {
        obs.unobserve(el);
        obs.observe(el);
      });
    };

    // After first paint
    requestAnimationFrame(observeAll);

    // After async data loads (API fetches)
    const t = setTimeout(observeAll, 1000);

    // Watch for new nodes added to DOM (resource cards, etc.)
    let debounce;
    const mut = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(observeAll, 100);
    });
    mut.observe(container, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      mut.disconnect();
      clearTimeout(t);
      clearTimeout(debounce);
    };
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const SIDEBAR_W = collapsed ? 72 : 240;

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full flex flex-col z-20 transition-all duration-300"
        style={{
          width: SIDEBAR_W,
          background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}>

        {/* Logo + collapse */}
        <div className={`flex items-center px-4 py-5 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? (
            <img src="/resourcery-logo.png" alt="R"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <img src="/resourcery-logo.png" alt="R"
                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                <span className="text-white font-bold text-lg whitespace-nowrap truncate">Resourcery</span>
              </div>
              <button onClick={toggleCollapsed}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button onClick={toggleCollapsed}
            className="mx-auto mt-2 w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(l =>
              (!l.adminOnly || isAdmin) && (!l.residentOnly || !isAdmin)
            );
            if (!visible.length) return null;
            return (
              <div key={section.label} className="mb-4">
                {!collapsed && (
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest px-3 mb-1">
                    {section.label}
                  </p>
                )}
                {visible.map(item => {
                  const active = pathname === item.to;
                  return (
                    <Link key={item.to + item.label} to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-sm font-medium ${
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}>
                      <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
          {/* Legal section for residents */}
          {!isAdmin && BOTTOM_NAV_ITEMS.filter(item => 
            (!item.adminOnly || isAdmin) && (!item.residentOnly || !isAdmin)
          ).map(item => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
                <item.icon style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          
          <Link to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
            <Settings style={{ width: 18, height: 18 }} className="flex-shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium">
            <LogOut style={{ width: 18, height: 18 }} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: SIDEBAR_W }}>

        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell isAdmin={isAdmin} username={user?.username} />
            <Link to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: '#FF8C42' }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.username}</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
