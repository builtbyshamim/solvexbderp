import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { asideToggle } from '../../../redux/features/toggleSlice';
import { accessTokenKey, refreshTokenKey } from '../../../contents/token';
import { useFetchMeQuery } from '../../../redux/api/authApi';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, isLoading } = useFetchMeQuery(null);
  const userInfo = data?.data;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    Cookies.remove(accessTokenKey, { path: '/' });
    Cookies.remove(refreshTokenKey, { path: '/' });
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const initials = userInfo?.name
    ? userInfo.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const notifications = [
    { id: 1, text: '3 products are low on stock', time: '5m ago', type: 'warning' },
    { id: 2, text: 'New sale INV-004 created', time: '22m ago', type: 'info' },
    { id: 3, text: 'Payroll for May is pending', time: '2h ago', type: 'warning' },
  ];

  return (
    <header className="bg-white border-b border-[#DBDFE9] sticky top-0 z-30 w-full">
      <div className="flex items-center justify-between h-14 px-4 md:px-5 gap-3">

        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(asideToggle())}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-[#DBDFE9] rounded-lg text-sm w-52 lg:w-64 focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] transition-colors"
            />
          </div>
        </div>

        {/* Right: notifications + user */}
        <div className="flex items-center gap-2">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-[#DBDFE9] rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#26272F]">Notifications</span>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifications.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${n.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#26272F]">{n.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#DBDFE9]">
                  <button className="text-xs text-[#ff6d29] hover:underline w-full text-center">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[#fff3eb] flex items-center justify-center flex-shrink-0">
                <span className="text-[#ff6d29] font-bold text-xs">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                {isLoading ? (
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#26272F] leading-tight">{userInfo?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-400 leading-tight">{userInfo?.role || 'Administrator'}</p>
                  </>
                )}
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 hidden sm:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white border border-[#DBDFE9] rounded-xl shadow-lg z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-[#26272F]">{userInfo?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{userInfo?.email || 'admin@bizcore.com'}</p>
                </div>
                <Link
                  to="/admin/settings/business"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#26272F] transition-colors"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link
                  to="/admin/settings/users"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#26272F] transition-colors"
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
      </div>
    </header>
  );
};

export default Header;
