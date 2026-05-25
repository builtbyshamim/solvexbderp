import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useFetchMeQuery } from '../../redux/api/authApi';
import { tokenHelper } from '../../helpers/axiosInstance';

function AdminRoleCheck({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useFetchMeQuery(undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  const user = data?.data;
  // if (isError || !user || user.role !== 'admin') {
  //   tokenHelper.clearTokens();
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authToken = Cookies.get('access_token');

  // if (!authToken) {
  //   return <Navigate to="/login" replace />;
  // }

  return <AdminRoleCheck>{children}</AdminRoleCheck>;
}
