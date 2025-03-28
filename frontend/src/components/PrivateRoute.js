import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Allow viewing without authentication and without major
  return children;
};

export default PrivateRoute;