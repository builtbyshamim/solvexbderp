import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/shared/navbar/Sidebar";
import Header from "../components/shared/navbar/Header";
import Footer from "../components/shared/Footer";

const MainLayout = () => {
  // const authToken = Cookies.get('access_token');
  // if (!authToken) {
  //     return <Navigate to="/login" replace />;
  // }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const location = useLocation();
  return (
    <>
      <div className="flex min-h-screen bg-gray-100 ">
        <Sidebar />
        <main
          className={`w-full ${location.pathname == "/dashboard/orders" ? "overflow-hidden" : ""} `}
        >
          <Header />
          {/* only content will be hidden, not header */}
          <div className="">
            <div className="p-1 sm:p-2 md:p-4 mb-14 w-full">
              <Outlet />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayout;
