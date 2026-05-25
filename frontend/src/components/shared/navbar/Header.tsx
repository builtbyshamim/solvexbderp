import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { FiUserMinus } from "react-icons/fi";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { TbLockPassword } from "react-icons/tb";
import { asideToggle } from "../../../redux/features/toggleSlice";
import { accessTokenKey, refreshTokenKey } from "../../../contents/token";
import { Bell, Search } from "lucide-react";
import { useFetchMeQuery } from "../../../redux/api/authApi";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, error, isLoading } = useFetchMeQuery(null);

  const userInfo = data?.data;
   console.log(userInfo,'userInfoz')

  const [activeTab, setActiveTab] = useState(false);
  const dropdownRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveTab(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    Cookies.remove(accessTokenKey, { path: "/" });
    Cookies.remove(refreshTokenKey, { path: "/" });

    navigate("/login");
    toast.success("Logged out successfully!");
  };

  return (
    <nav className="bg-white border sticky z-40 top-0 w-full px-4 border-b border-[#E2E8F0] md:px-6 py-2.5">
      <div className="flex justify-between items-center gap-1">

        {/* Left */}
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch(asideToggle())}>
            ☰
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input
              type="search"
              placeholder="Search dashboard..."
              className="pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm w-64"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">

          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600"/>
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"/>
          </button>

          <div
            onClick={() => setActiveTab(!activeTab)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[#ffe8d2] flex items-center justify-center text-[#ff6d29] font-semibold">
              {userInfo?.name?.charAt(0) || "U"}
            </div>

            <div>
              {isLoading ? (
                <p className="text-sm">Loading...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">{userInfo?.name}</p>
                  <p className="text-xs text-gray-500">{userInfo?.email}</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute right-0 top-14 min-w-[250px] bg-white shadow rounded transition ${
          activeTab ? "block" : "hidden"
        }`}
      >

        <Link
          to="/dashboard/profile"
          className="px-6 py-2 flex items-center gap-2 hover:bg-gray-100"
        >
          <FiUserMinus />
          Profile
        </Link>

        <Link
          to="/dashboard/change-password"
          className="px-6 py-2 flex items-center gap-2 hover:bg-gray-100"
        >
          <TbLockPassword />
          Settings
        </Link>

        <div
          onClick={handleLogout}
          className="px-6 py-2 flex items-center gap-2 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
        >
          <RiLogoutCircleRLine />
          Logout
        </div>

      </div>
    </nav>
  );
};

export default Header;