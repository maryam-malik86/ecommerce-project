import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/orders', label: 'Orders', icon: '🛒' },
  { to: '/inventory', label: 'Inventory', icon: '🏭' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/newsletter', label: 'Newsletter', icon: '📧' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">⚡ E-Commerce</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                }`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
