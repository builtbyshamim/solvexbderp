import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { accessTokenKey } from '../../contents/token';

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.role ?? null;
  } catch {
    return null;
  }
}

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = Cookies.get(accessTokenKey);

  if (!token) {
    return <Navigate to="/super-admin/login" replace />;
  }

  const role = decodeJwtRole(token);
  if (role !== 'super_admin') {
    return <Navigate to="/super-admin/login" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
