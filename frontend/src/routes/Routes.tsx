import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthUserNotAccessRoute from '../components/providers/AuthUserNotAccessRoute';
import ProtectedRoute from '../components/providers/ProtectedRoute';
import LoginPage from '../components/auth/Login';
import ForgotPassword from '../components/auth/ForgotPassword';
import Dashboard from '../components/dashboard/Dashboard';
import ProductList from '../features/inventory/products/pages/AllProduct';
import EditProduct from '../features/inventory/products/pages/EditProduct';
import AddProduct from '../features/inventory/products/pages/AddProduct';
import AllCategory from '../features/inventory/category/pages/AllCategory';
import AllBrand from '../features/inventory/brand/AllBrand';
import ProductMedia from '../features/inventory/products/pages/ProductMedia';
import UserList from '../features/users/pages/UserList';
import MlmUserDetails from '../features/users/pages/Mlmuserdetails';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthUserNotAccessRoute> </AuthUserNotAccessRoute>,
  },
  {
    path: '/login',
    element: (
      <AuthUserNotAccessRoute>
        <LoginPage />
      </AuthUserNotAccessRoute>
    ),
  },
  {
    path: '/auth/forgot-password',
    element: (
      <AuthUserNotAccessRoute>
        <ForgotPassword />
      </AuthUserNotAccessRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/admin',
        element: <Dashboard />,
      },
      {
        path: '/admin/manage-users',
        element: <UserList />,
      },
      {
        path: '/admin/manage-users/mlm/:userId',
        element: <MlmUserDetails />,
      },
    ],
  },
]);

export default router;
