import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDashboardMenuData } from '../../../utils/DashboardMenuData';
import { asideToggle } from '../../../redux/features/toggleSlice';

const Brand = () => (
  <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ff6d29] to-[#ff8d57] flex items-center justify-center shadow-sm flex-shrink-0">
      <span className="text-white font-black text-sm tracking-tight">BC</span>
    </div>
    <div>
      <h1 className="text-[15px] font-bold text-[#26272F] leading-tight">BizCore ERP</h1>
      <p className="text-[10px] text-gray-400 leading-tight">Business Management</p>
    </div>
  </div>
);

const Sidebar = () => {
  const dispatch = useDispatch();
  const menuData = useDashboardMenuData();
  const location = useLocation();
  const { aside } = useSelector((state: any) => state.toggle);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const handleToggle = (id: number) => setOpenMenu(openMenu === id ? null : id);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) dispatch(asideToggle());
  };

  useEffect(() => {
    menuData?.forEach((menu: any) => {
      if (menu.subMenu?.some((sub: any) => sub.path === location.pathname)) {
        setOpenMenu(menu.id);
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aside) dispatch(asideToggle());
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [aside, dispatch]);

  const MenuList = ({ onLinkClick }: { onLinkClick: () => void }) => (
    <ul className="space-y-0.5">
      {menuData?.filter(Boolean)?.map((menu: any) => {
        const isActive =
          location.pathname === menu.path ||
          menu.subMenu?.some((s: any) => s.path === location.pathname);
        const isOpen = openMenu === menu.id;

        return (
          <li key={menu.id}>
            {menu.subMenu ? (
              <button
                onClick={() => handleToggle(menu.id)}
                className={`w-full px-3 py-2.5 flex items-center justify-between rounded-lg transition-all duration-150 group ${
                  isActive ? 'bg-[#fff3eb] text-[#ff6d29]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#26272F]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex-shrink-0 ${isActive ? 'text-[#ff6d29]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {menu.icon}
                  </span>
                  <span className={`text-sm font-medium ${isActive ? 'text-[#ff6d29]' : ''}`}>{menu.name}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-90 text-[#ff6d29]' : 'text-gray-300'
                  }`}
                />
              </button>
            ) : (
              <Link
                to={menu.path}
                onClick={onLinkClick}
                className={`w-full px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-all duration-150 group ${
                  isActive ? 'bg-[#fff3eb] text-[#ff6d29]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#26272F]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-[#ff6d29]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {menu.icon}
                </span>
                <span className={`text-sm font-medium ${isActive ? 'text-[#ff6d29]' : ''}`}>{menu.name}</span>
              </Link>
            )}

            {menu.subMenu && (
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <ul className="ml-3 mt-0.5 pl-3 border-l border-[#DBDFE9] space-y-0.5 pb-1">
                  {menu.subMenu.map((sub: any) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <li key={sub.id}>
                        <Link
                          to={sub.path}
                          onClick={onLinkClick}
                          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                            subActive
                              ? 'text-[#ff6d29] font-medium bg-[#fff3eb]'
                              : 'text-gray-500 hover:text-[#26272F] hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${subActive ? 'bg-[#ff6d29]' : 'bg-gray-300'}`} />
                          {sub.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile overlay */}
      {aside && (
        <div
          onClick={() => dispatch(asideToggle())}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-white h-full w-64 border-r border-[#DBDFE9] fixed left-0 top-0 bottom-0 z-30">
        <div className="px-5 py-4 border-b border-[#DBDFE9] flex-shrink-0">
          <Link to="/admin"><Brand /></Link>
        </div>

        <div className="flex-1 overflow-y-auto sidebarScroll px-3 py-4 space-y-4">
          <MenuList onLinkClick={() => {}} />
        </div>

        <div className="border-t border-[#DBDFE9] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-8 w-8 rounded-full bg-[#fff3eb] flex items-center justify-center flex-shrink-0">
              <span className="text-[#ff6d29] font-bold text-xs">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#26272F] truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          aside ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b border-[#DBDFE9] flex items-center justify-between flex-shrink-0">
          <Link to="/admin" onClick={handleLinkClick}><Brand /></Link>
          <button
            onClick={() => dispatch(asideToggle())}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sidebarScroll px-3 py-4">
          <MenuList onLinkClick={handleLinkClick} />
        </div>

        <div className="border-t border-[#DBDFE9] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-8 w-8 rounded-full bg-[#fff3eb] flex items-center justify-center flex-shrink-0">
              <span className="text-[#ff6d29] font-bold text-xs">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#26272F] truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
