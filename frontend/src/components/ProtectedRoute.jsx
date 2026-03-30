import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const location = useLocation();

  const userString = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");

  const user = userString ? JSON.parse(userString) : null;

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
}