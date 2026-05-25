import { Link, useLocation } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDashboardMenuData } from "../../../utils/DashboardMenuData";
import { asideToggle } from "../../../redux/features/toggleSlice";

const Sidebar = () => {
  const dispatch = useDispatch();
  const menuData = useDashboardMenuData();
  const location = useLocation();
  const { aside } = useSelector((state) => state.toggle);
  const [openMenu, setOpenMenu] = useState(null);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  console.log(aside, "aside");

  const handleToggle = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  const handleLinkClick = () => {
    setOpenMenu(null);
    if (window.innerWidth < 768) {
      dispatch(asideToggle());
    }
  };

  // ⭐ Auto open correct submenu on page reload
  useEffect(() => {
    if (!openMenu) {
      menuData?.forEach((menu) => {
        // If this menu has submenu and any submenu matches current path
        if (menu.subMenu?.some((sub) => sub.path === location.pathname)) {
          setOpenMenu(menu.id);
        }
        // If this menu path itself matches route
        else if (menu.path === location.pathname) {
          setOpenMenu(null); // no submenu, so close
        }
      });
    }
  }, [location.pathname, menuData, openMenu]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && aside) {
        dispatch(asideToggle());
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [aside, dispatch]);

  return (
    <>
      {/* Overlay with backdrop blur - Only for mobile */}
      {aside && (
        <div
          onClick={() => dispatch(asideToggle())}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* Desktop Sidebar - Always visible on desktop */}
      <div
        className={`
           flex-col
          bg-linear-to-b from-white to-gray-50
          h-full w-64
          border-r border-[#DBDFE9]
          shadow-sm
            ${aside ? "hidden" : " hidden md:flex"}
          fixed left-0 top-0 bottom-0 z-30
        `}
      >
        {/* Fixed Logo Section - No Scroll */}
        <div className="px-6 py-2 border-b border-gray-200 bg-white shrink-0">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#ff6d29] to-[#ff8d57] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">NA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#26272F]">Next Admin</h1>
              <p className="text-xs text-gray-500">Dashboard v2.0</p>
            </div>
          </Link>
        </div>

        {/* Scrollable Menu Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto sidebarScroll px-2 py-4">
            <div className="mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                Main Menu
              </p>
              <ul className="space-y-1">
                {menuData?.filter(Boolean)?.map((menu) => {
                  const isActive =
                    location.pathname === menu.path ||
                    menu.subMenu?.some((s) => s.path === location.pathname);
                  const isOpen = openMenu === menu.id;

                  return (
                    <li key={menu.id} className="relative">
                      {/* Active indicator */}

                      <div
                        onClick={() =>
                          menu.subMenu
                            ? handleToggle(menu.id)
                            : handleLinkClick()
                        }
                        onMouseEnter={() => setHoveredMenu(menu.id)}
                        onMouseLeave={() => setHoveredMenu(null)}
                        className={`relative px-2 py-3 flex justify-between items-center cursor-pointer rounded-lg transition-all duration-200 group ${
                          isActive
                            ? "bg-[#ffe8d2] text-[#ff6d29]"
                            : "text-[#26272F] hover:bg-gray-100 hover:text-[#ff6d29]"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? "text-[#ff6d29]"
                                : "text-gray-500 group-hover:text-[#ff6d29]"
                            }`}
                          >
                            {menu.icon}
                          </div>

                          <span
                            className={`font-medium text-sm ${
                              isActive
                                ? "text-[#ff6d29]"
                                : "text-[#26272F] group-hover:text-[#ff6d29]"
                            }`}
                          >
                            {menu.name}
                          </span>
                        </div>

                        {menu.subMenu && (
                          <FaAngleRight
                            className={`text-sm transition-transform duration-300 ${
                              isOpen
                                ? "rotate-90 text-[#ff6d29]"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </div>

                      {/* Submenu */}
                      {menu.subMenu && (
                        <div
                          className={`ml-5 overflow-hidden transition-all duration-300 ${
                            isOpen
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="py-2 space-y-0.5">
                            {menu.subMenu.map((sub) => {
                              const subActive = location.pathname === sub.path;

                              return (
                                <Link
                                  key={sub.id}
                                  to={sub.path}
                                  onClick={handleLinkClick}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    subActive
                                      ? "bg-[#ffe8d2] text-[#ff6d29] font-medium"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-[#ff6d29]"
                                  }`}
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      subActive ? "bg-[#ff6d29]" : "bg-gray-300"
                                    }`}
                                  ></div>
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Additional Menu Sections */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                Analytics
              </p>
              <ul className="space-y-1">
                <li className="relative">
                  <div className="px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-1.5 rounded-lg text-gray-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#26272F]">
                      Reports
                    </span>
                  </div>
                </li>
                <li className="relative">
                  <div className="px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-1.5 rounded-lg text-gray-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#26272F]">
                      Revenue
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Fixed Footer Section - No Scroll */}
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            <div className="space-y-3">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-2 bg-gradient-to-r from-[#ff6d29] to-[#ff8d57] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
                  New Report
                </button>
                <button className="px-3 py-2 border border-[#DBDFE9] text-[#26272F] text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Settings
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff6d29] to-[#ff8d57] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#26272F] truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    admin@example.com
                  </p>
                </div>
                <button className="p-1.5 hover:bg-white rounded-lg transition-colors">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Controlled by 'aside' state */}
      <div
        className={`
          md:hidden
          flex flex-col
          bg-white
          fixed top-0 left-0
          h-full w-64
          transform
          transition-all duration-300 ease-in-out
          ${aside ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          z-401
        `}
      >
        {/* Fixed Mobile Header */}
        <div className="px-3 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              onClick={handleLinkClick}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#ff6d29] to-[#ff8d57] flex items-center justify-center">
                <span className="text-white font-bold text-lg">NA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#26272F]">Next Admin</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </Link>
            <button
              onClick={() => dispatch(asideToggle())}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Mobile Menu */}
        <div className="flex-1 overflow-y-auto sidebarScroll px-2 py-4">
          <ul className="space-y-1">
            {menuData?.filter(Boolean)?.map((menu) => {
              const isActive =
                location.pathname === menu.path ||
                menu.subMenu?.some((s) => s.path === location.pathname);
              const isOpen = openMenu === menu.id;

              return (
                <li key={menu.id} className="relative">
                  {/* Active indicator for mobile */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6d29] rounded-r-full"></div>
                  )}

                  <div
                    onClick={() =>
                      menu.subMenu ? handleToggle(menu.id) : handleLinkClick()
                    }
                    className={`px-2 py-3 flex justify-between items-center cursor-pointer rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#ffe8d2] text-[#ff6d29]"
                        : "text-[#26272F] hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isActive ? "text-[#ff6d29]" : "text-gray-500"
                        }`}
                      >
                        {menu.icon}
                      </div>
                      <span
                        className={`font-medium text-sm ${
                          isActive ? "text-[#ff6d29]" : "text-[#26272F]"
                        }`}
                      >
                        {menu.name}
                      </span>
                    </div>

                    {menu.subMenu && (
                      <FaAngleRight
                        className={`text-sm transition-transform duration-300 ${
                          isOpen ? "rotate-90 text-[#ff6d29]" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>

                  {menu.subMenu && (
                    <div
                      className={`ml-5 overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-96" : "max-h-0"
                      }`}
                    >
                      <div className="py-2 space-y-0.5">
                        {menu.subMenu.map((sub) => {
                          const subActive = location.pathname === sub.path;

                          return (
                            <Link
                              key={sub.id}
                              to={sub.path}
                              onClick={handleLinkClick}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                                subActive
                                  ? "bg-[#ffe8d2] text-[#ff6d29] font-medium"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  subActive ? "bg-[#ff6d29]" : "bg-gray-300"
                                }`}
                              ></div>
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Additional Mobile Content */}
          <div className="mt-8">
            <div className="px-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Links
              </p>
              <div className="space-y-1">
                <button className="w-full px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Help & Support
                </button>
                <button className="w-full px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Documentation
                </button>
                <button className="w-full px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Keyboard Shortcuts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Mobile Footer */}
        <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 p-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#26272F]">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-[#ff6d29] to-[#ff8d57] text-white text-sm font-medium rounded-lg">
              Log Out
            </button>
          </div>
        </div>
      </div>
      {/* Spacer for Desktop (since sidebar is fixed) */}
      <div
        className={`${aside ? "hidden" : "  hidden md:block"}  w-64 shrink-0`}
      ></div>
    </>
  );
};

export default Sidebar;
