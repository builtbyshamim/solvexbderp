import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Shield,
  Package,
  BarChart3,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { accessTokenKey, refreshTokenKey } from '../contents/token';
import { useGetPendingCountQuery } from '../redux/api/billingApi';

const NAV_ITEMS = [
  { id: 1, label: 'Dashboard',        path: '/super-admin/dashboard',        icon: LayoutDashboard },
  { id: 2, label: 'Businesses',       path: '/super-admin/businesses',       icon: Building2 },
  { id: 3, label: 'Users',            path: '/super-admin/users',            icon: Users },
  { id: 4, label: 'Subscriptions',    path: '/super-admin/subscriptions',    icon: CreditCard },
  { id: 5, label: 'Packages',         path: '/super-admin/packages',         icon: Package },
  { id: 6, label: 'Payment Requests', path: '/super-admin/payment-requests', icon: Smartphone, badge: true },
  { id: 7, label: 'Reports',          path: '/super-admin/reports',          icon: BarChart3 },
  { id: 8, label: 'Announcements',    path: '/super-admin/announcements',    icon: MessageSquare },
  { id: 9, label: 'Settings',         path: '/super-admin/settings',         icon: Settings },
];

const SuperAdminSidebar = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const location = useLocation();
  const { data: pendingData } = useGetPendingCountQuery(undefined, { pollingInterval: 60000 });
  const pendingCount = pendingData?.count ?? 0;

  const NavLink = ({ item, onClick }: { item: (typeof NAV_ITEMS)[0]; onClick?: () => void }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`flex-shrink-0 ${isActive ? 'text-[#ff6d29]' : ''}`} style={{ height: '18px', width: '18px' }} />
        <span className="flex-1">{item.label}</span>
        {item.badge && pendingCount > 0 && (
          <span className="ml-auto px-1.5 py-0.5 bg-amber-400 text-[#26272F] text-[10px] font-bold rounded-full leading-none min-w-[18px] text-center">
            {pendingCount}
          </span>
        )}
        {isActive && !item.badge && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff6d29]" />}
      </Link>
    );
  };

  const SidebarContent = ({ mobile }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-[#0f1623]">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <Link to="/super-admin/dashboard" onClick={mobile ? onClose : undefined} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#ff6d29] flex items-center justify-center shadow-sm flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-white leading-tight">SolvexBD</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Super Admin Panel</p>
          </div>
        </Link>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Platform
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} item={item} onClick={mobile ? onClose : undefined} />
        ))}
      </nav>

      {/* Admin info */}
      <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#ff6d29]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#ff6d29] font-bold text-xs">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Super Admin</p>
            <p className="text-xs text-slate-400 truncate">Platform Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 z-30 border-r border-white/5">
        <SidebarContent />
      </aside>
      <div className="hidden md:block w-60 flex-shrink-0" />

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-60 z-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent mobile />
      </aside>
    </>
  );
};

const SuperAdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    Cookies.remove(accessTokenKey, { path: '/' });
    Cookies.remove(refreshTokenKey, { path: '/' });
    navigate('/super-admin/login');
    toast.success('Logged out');
  };

  return (
    <header className="bg-white border-b border-[#DBDFE9] sticky top-0 z-30 h-14 flex items-center px-4 md:px-5 gap-3 justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Super admin badge */}
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs font-semibold text-[#ff6d29]">
          <Shield className="h-3.5 w-3.5" />
          Super Admin
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-[#ff6d29]/10 flex items-center justify-center">
              <span className="text-[#ff6d29] font-bold text-xs">SA</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-[#26272F] leading-tight">Super Admin</p>
              <p className="text-xs text-gray-400 leading-tight">Platform Admin</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-[#DBDFE9] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <Link
                to="/super-admin/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <div className="border-t border-gray-50 mt-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-5 lg:p-6 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
