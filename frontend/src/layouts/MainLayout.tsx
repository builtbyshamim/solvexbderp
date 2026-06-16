import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shared/navbar/Sidebar';
import Header from '../components/shared/navbar/Header';
import SubscriptionGate from '../components/providers/SubscriptionGate';

const MainLayout = () => (
  <SubscriptionGate>
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-5 lg:p-6 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  </SubscriptionGate>
);

export default MainLayout;
