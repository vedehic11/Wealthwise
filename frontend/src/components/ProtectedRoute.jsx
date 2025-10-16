
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    return <Navigate to="/sign-in" />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
