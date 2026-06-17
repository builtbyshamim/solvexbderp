import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import type { ReactNode } from "react";
interface Props {
  children: ReactNode;
}

export default function AuthUserNotAccessRoute({ children }: Props) {
  const authToken = Cookies.get("access_token");

  // If user is already logged in, block access to auth pages (login/register)
  if (authToken) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
