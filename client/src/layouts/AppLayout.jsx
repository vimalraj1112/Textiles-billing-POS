import { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ScanLine,
  Package,
  Boxes,
  Tags,
  ShoppingCart,
  Truck,
  Users,
  ReceiptText,
  RotateCcw,
  Wallet,
  BarChart3,
  UserCog,
  ScrollText,
  Settings,
  LogOut,
  Bell,
  Menu,
  Shirt,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api';
import { ROLE_LABELS, ROLES } from '../constants';
import { formatTime, initials } from '../utils/format';

const ALL = [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.STAFF];
const NO_STAFF = [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER];
const ADMIN_ONLY = [ROLES.ADMIN];
const ADMIN_MANAGER = [ROLES.ADMIN, ROLES.MANAGER];

const NAV = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: NO_STAFF },
  { label: 'POS Billing', to: '/pos', icon: ScanLine, roles: ALL },
  { label: 'Products', to: '/products', icon: Package, roles: ALL },
  { label: 'Inventory', to: '/inventory', icon: Boxes, roles: ALL },
  { label: 'Categories', to: '/categories', icon: Tags, roles: ADMIN_MANAGER },
  { label: 'Sales', to: '/sales', icon: ReceiptText, roles: NO_STAFF },
  { label: 'Purchases', to: '/purchases', icon: ShoppingCart, roles: ADMIN_MANAGER },
  { label: 'Suppliers', to: '/suppliers', icon: Truck, roles: ADMIN_MANAGER },
  { label: 'Customers', to: '/customers', icon: Users, roles: NO_STAFF },
  { label: 'Returns', to: '/returns', icon: RotateCcw, roles: NO_STAFF },
  { label: 'Expenses', to: '/expenses', icon: Wallet, roles: ADMIN_MANAGER },
  { label: 'Reports', to: '/reports', icon: BarChart3, roles: ADMIN_MANAGER },
  { label: 'Employees', to: '/employees', icon: UserCog, roles: ADMIN_ONLY },
  { label: 'Audit Logs', to: '/audit-logs', icon: ScrollText, roles: ADMIN_ONLY },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ADMIN_MANAGER },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list({ limit: 8 }).then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const unread = notifData?.unread || 0;
  const items = notifData?.items || [];

  const navItems = NAV.filter((n) => user && n.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sky-100 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Shirt className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">Mathi Collections</div>
          <div className="text-xs text-slate-400">Dress Shop POS</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin px-2 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sky-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {initials(user?.name)}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">{user?.name}</div>
              <div className="text-[10px] text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="hidden w-60 shrink-0 border-r border-sky-200 bg-sky-50 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sky-50">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-sky-200 bg-sky-50 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="font-semibold text-slate-700 lg:hidden">Mathi Collections</Link>
            <div className="hidden text-sm text-slate-500 lg:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="relative">
            <button
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">Notifications</span>
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => notificationApi.readAll().then(() => window.location.reload())}>
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-400">No notifications</p>}
                    {items.map((n) => (
                      <div key={n._id} className="flex gap-2 border-b border-slate-50 px-4 py-3">
                        <span className={'mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (n.read ? 'bg-slate-300' : 'bg-blue-500')} />
                        <div>
                          <div className="text-sm font-medium text-slate-700">{n.title}</div>
                          <div className="text-xs text-slate-500">{n.message}</div>
                          <div className="mt-0.5 text-[10px] text-slate-400">{formatTime(n.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}