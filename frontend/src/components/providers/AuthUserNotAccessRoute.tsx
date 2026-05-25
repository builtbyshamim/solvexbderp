import { Navigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { ReactNode } from "react";
interface Props {
  children: ReactNode;
}

export default function AuthUserNotAccessRoute({ children }: Props) {
  const { pathname } = useLocation();

  const authToken = Cookies.get("access_token");

  // If user is already logged in, block access (login/register pages)
  if (authToken) {
    return <Navigate to="/admin" replace />;
  }

  // If user hits root without auth, send to login
  if (pathname === "/") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
