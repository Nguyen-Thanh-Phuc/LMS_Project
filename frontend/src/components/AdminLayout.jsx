import { useNavigate, Outlet } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { label: "Courses", path: "/admin/courses", icon: "📚" },
    { label: "Students", path: "/admin/students", icon: "👥" },
    { label: "Enrollments", path: "/admin/enrollments", icon: "📝" },
    { label: "Quizzes", path: "/admin/quizzes", icon: "❓" },
    { label: "Attempts", path: "/admin/attempts", icon: "✍️" },
    { label: "Certificates", path: "/admin/certificates", icon: "🏆" },
{ label: "Question Bank", path: "/admin/question-bank", icon: "📚" },  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>LMS Admin</h2>
          <p className="admin-badge">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className="nav-item"
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="header-info">
            <span className="role-badge">Administrator</span>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
