import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * Guards routes on the client:
 *  - not logged in        -> redirect to /login (remembering where they were going)
 *  - wrong role (roles=[])-> redirect to the dashboard
 * The API enforces the same rules server-side; this only improves the UX.
 */
export default function ProtectedRoute({ roles }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Loader label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** Keeps signed-in users away from /login and /register. */
export function GuestRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
