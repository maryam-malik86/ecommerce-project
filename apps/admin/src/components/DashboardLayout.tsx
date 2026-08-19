import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  HelpCircle,
  MessageSquare,
  Warehouse,
  BarChart3,
  Mail,
  Users,
  ShieldCheck,
  KeyRound,
  Sliders,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Layers,
} from 'lucide-react';

const mainNavLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/products', label: 'Products', Icon: Package },
  { to: '/categories', label: 'Collections', Icon: Layers },
  { to: '/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/inquiries', label: 'Client Inquiries', Icon: MessageSquare },
  { to: '/inventory', label: 'Inventory', Icon: Warehouse },
  { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/newsletter', label: 'Newsletter', Icon: Mail },
  { to: '/customers', label: 'Customers', Icon: Users },
];


const systemNavLinks = [
  { to: '/system/staff', label: 'Staff Management', Icon: ShieldCheck },
  { to: '/system/roles', label: 'Roles & Permissions', Icon: KeyRound },
  { to: '/system/email-templates', label: 'Email Templates', Icon: Mail },
  { to: '/system/settings', label: 'System Settings', Icon: Sliders },
];


export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state
  const [systemExpanded, setSystemExpanded] = useState(true);
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [bottomMenuOpen, setBottomMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const topMenuRef = useRef<HTMLDivElement>(null);
  const bottomMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(event.target as Node)) {
        setTopMenuOpen(false);
        setNotificationsOpen(false);
      }
      if (bottomMenuRef.current && !bottomMenuRef.current.contains(event.target as Node)) {
        setBottomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = { name: 'Admin User', email: 'admin@store.com', initials: 'AU' };

  // Conditional Breadcrumb Logic:
  // Hidden on top-level root pages, shown only when 2+ levels deep
  const pathname = location.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  const isDeepBreadcrumb = pathSegments.length > 2 || (pathSegments.length === 2 && !pathname.startsWith('/system/'));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ui-bg-subtle)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden animate-fade-in"
          style={{ background: 'var(--ui-bg-overlay)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-30 flex flex-col border-r transition-all duration-200 ease-in-out flex-shrink-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'w-16 min-w-[4rem] max-w-[4rem]' : 'w-60 min-w-[15rem] max-w-[15rem]'}`}
        style={{
          background: 'var(--ui-bg-base)',
          borderColor: 'var(--ui-border-base)',
        }}
      >
        {/* Logo Header */}
        <div
          className={`flex items-center h-14 border-b px-3.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          style={{ borderColor: 'var(--ui-border-base)' }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0"
                style={{ background: 'var(--ui-accent)' }}
              >
                S
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-none truncate" style={{ color: 'var(--ui-fg-base)' }}>
                  StoreCo
                </p>
                <p className="text-2xs font-medium mt-0.5 truncate text-slate-400 dark:text-zinc-500">
                  Admin Panel
                </p>
              </div>
            </div>
          )}

          {/* PanelLeft Toggle Icon */}
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors duration-150 flex items-center justify-center"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Consistent Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {mainNavLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `nav-link flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-medium'
                    : 'text-slate-600 dark:text-zinc-400 font-normal hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {/* ── System Collapsible Group ──────────────────── */}
          <div className="pt-3">
            {!isCollapsed ? (
              <button
                onClick={() => setSystemExpanded(!systemExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 uppercase tracking-wider"
              >
                <span>System</span>
                {systemExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-zinc-800 my-2" />
            )}

            {(systemExpanded || isCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {systemNavLinks.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? `System > ${label}` : undefined}
                    className={({ isActive }) =>
                      `nav-link flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors duration-150 ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-medium'
                          : 'text-slate-600 dark:text-zinc-400 font-normal hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Admin User Area */}
        <div
          ref={bottomMenuRef}
          className="h-14 px-3 border-t relative flex items-center"
          style={{ borderColor: 'var(--ui-border-base)', flexShrink: 0 }}
        >
          <button
            onClick={() => setBottomMenuOpen(!bottomMenuOpen)}
            className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Account Options"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-zinc-700 text-white font-bold text-2xs flex items-center justify-center flex-shrink-0 shadow-sm">
                {user.initials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold leading-none truncate text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-2xs truncate mt-0.5 text-slate-400 dark:text-zinc-500">
                    Administrator
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
            )}
          </button>

          {/* Bottom Sidebar Popup Menu (Positioned DIRECTLY ABOVE bottom profile card!) */}
          {bottomMenuOpen && (
            <div
              className={`absolute bottom-16 z-50 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-slide-in space-y-1 text-xs ${
                isCollapsed ? 'left-16 w-52' : 'left-3 right-3'
              }`}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-2xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>Appearance</span>
                </span>
                <span className="text-2xs text-slate-400 uppercase font-semibold">{theme}</span>
              </button>

              <button
                onClick={() => {
                  navigate('/system/settings');
                  setBottomMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <Sliders className="w-4 h-4" />
                <span>System Settings</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Workspace ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Shrunken h-14 Top Navigation Bar */}
        <header
          className="h-14 border-b px-4 flex items-center justify-between"
          style={{
            background: 'var(--ui-bg-base)',
            borderColor: 'var(--ui-border-base)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>

            {/* Conditional Breadcrumb: Only shown when 2+ levels deep */}
            {isDeepBreadcrumb && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500">
                <span className="capitalize">{pathSegments[0]}</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-white capitalize">{pathSegments[1]}</span>
              </div>
            )}
          </div>

          {/* Right Header: Notification Bell (Compact) + Profile Avatar (Compact) */}
          <div className="flex items-center gap-2 relative" ref={topMenuRef}>
            {/* Compact Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-center"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 border border-white dark:border-zinc-900" />
            </button>

            {/* Notification Popup */}
            {notificationsOpen && (
              <div className="absolute top-11 right-8 w-72 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 animate-slide-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Notifications</p>
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold">
                    1 New
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300">
                    <p className="font-semibold text-slate-900 dark:text-white">System Update Ready</p>
                    <p className="text-2xs text-slate-400 mt-0.5">Database migration 009 applied cleanly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Profile Avatar Button (Top Right Header) */}
            <button
              onClick={() => setTopMenuOpen(!topMenuOpen)}
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-2xs flex items-center justify-center shadow-sm hover:ring-2 hover:ring-indigo-500/30 transition-all"
              title="Account Menu"
            >
              {user.initials}
            </button>

            {/* Top Right Dropdown Menu (Positioned DIRECTLY BELOW top right avatar!) */}
            {topMenuOpen && (
              <div className="absolute top-11 right-0 w-56 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 animate-slide-in space-y-1 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                  <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
                </div>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>Appearance</span>
                  </span>
                  <span className="text-2xs text-slate-400 uppercase font-semibold">{theme}</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/system/settings');
                    setTopMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                  <span>System Settings</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto min-h-0 p-6 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
