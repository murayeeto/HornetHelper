import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user hasn't set their major, redirect to login page
  if (!user.major) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;