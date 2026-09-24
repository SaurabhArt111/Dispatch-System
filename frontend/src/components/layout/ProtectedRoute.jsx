import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../ui/Loader';

export default function ProtectedRoute({ children, perm }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (perm && !hasPermission(perm)) {
    return (
      <div className="state-box state-error">
        <div className="state-icon">🔒</div>
        <div className="state-title">You don't have access to this page</div>
        <div>Ask an administrator to grant you the required permission.</div>
      </div>
    );
  }
  return children;
}
