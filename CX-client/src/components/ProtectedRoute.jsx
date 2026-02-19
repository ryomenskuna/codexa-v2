import { Navigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext";
import { useAuth } from "../context/authContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const { setAuthType } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setAuthType("login");
    }
  }, [user, setAuthType]);

  if (!user) {
    return (
      <Navigate
        to="/home"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
