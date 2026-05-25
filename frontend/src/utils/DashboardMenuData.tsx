import {
  MdBusinessCenter,
  MdCenterFocusStrong,
  MdOutlineAccountBalance,
  MdOutlineCalendarMonth,
  MdOutlineDashboard,
  MdShoppingCart,
} from 'react-icons/md';
import { TbShoppingCartBolt } from 'react-icons/tb';
import { FaUsers } from 'react-icons/fa';
import { HiTruck } from 'react-icons/hi';
import { CiCompass1, CiDollar } from 'react-icons/ci';
import { IoIosSettings } from 'react-icons/io';
type RoleId = '1' | '2';
type MenuItem = {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
  subMenu?: Array<{ id: number; name: string; path: string }>;
};

export const useDashboardMenuData = () => {
  const role_id: RoleId = '1'; // উদাহরণস্বরূপ, পরে Redux/Context থেকে আসবে
  const menuItems: (MenuItem | false)[] = [
    // ১. ড্যাশবোর্ড
    {
      id: 1,
      name: 'Dashboard',
      path: '/dashboard',
      icon: <MdOutlineDashboard />,
    },

    // ২. অর্ডার ম্যানেজমেন্ট
    {
      id: 2,
      name: 'Orders',
      path: '/admin/orders',
      icon: <TbShoppingCartBolt />,
      subMenu: [
        {
          id: 1,
          name: 'Multiple Product Order',
          path: '/admin/orders/multiple',
        },
        { id: 2, name: 'Single Order', path: '/admin/orders/single-order' },
        { id: 3, name: 'Manage Orders', path: '/admin/orders' },
      ],
    },

    {
      id: 1001,
      name: 'Offers',
      path: '/admin/offers',
      icon: <CiCompass1 />,
      subMenu: [{ id: 1, name: 'Manage Deals', path: '/admin/offers/manage-deals' }],
    },

    {
      id: 4,
      name: 'Users',
      path: '/admin/manage-users',
      icon: <FaUsers />,
      subMenu: [{ id: 1, name: 'Manage Users', path: '/admin/manage-users' }],
    },

    // ১২. সেটিংস
    {
      id: 6,
      name: 'Settings',
      path: '/admin/common/payment-status',
      icon: <IoIosSettings />,
      subMenu: [
        { id: 1, name: 'Payment Status', path: '/admin/common/payment-status' },
        { id: 2, name: 'Consumer Type', path: '/admin/common/consumer-types' },
        {
          id: 3,
          name: 'Fraud Detections',
          path: '/admin/common/fraud-detections',
        },
        {
          id: 4,
          name: 'Order Sources',
          path: '/admin/common/manage-order-sources',
        },
      ],
    },
  ];

  // role_id === "1" হলে সমস্ত আইটেম ফিল্টার করে রিটার্ন করবে
  return menuItems.filter(Boolean) as MenuItem[];
};
