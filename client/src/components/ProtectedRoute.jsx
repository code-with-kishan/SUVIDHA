import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles, allowGuest = false }) {
  const { token, user, guestMode } = useSelector((state) => state.auth);

  if (!token && guestMode && allowGuest) {
    return children;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
