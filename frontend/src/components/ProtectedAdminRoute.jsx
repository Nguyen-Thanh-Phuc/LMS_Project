import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("accessToken");

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/" />;
  }

  // Check admin role
  if (user.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
        <p>Required role: Admin | Your role: {user.role}</p>
        <a href="/">Go back to home</a>
      </div>
    );
  }

  return children;
}
