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

/**
 * Guards routes inside the /admin layout that only super admins may visit.
 * Regular users are sent back to /admin dashboard.
 */
export default function SuperAdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = Cookies.get(accessTokenKey);
  const role  = token ? decodeJwtRole(token) : null;

  if (role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
