import { Outlet, Link, useNavigate } from "react-router-dom";

export default function StudentLayout() {
  const navigate = useNavigate();
  
  // Lấy thông tin user từ localStorage để hiển thị tên trên góc phải
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    // Xóa toàn bộ dữ liệu đăng nhập
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    // Đẩy về trang Login
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* TOP BAR CHUẨN THEO ẢNH DESIGN */}
      <nav style={styles.topbar}>
        {/* Bên trái: Logo + Link về Dashboard */}
        <Link to="/student-dashboard" style={styles.brand}>
          <span style={styles.icon}>📚</span> LMS Platform
        </Link>

        {/* Bên phải: Tên User + Nút Logout */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <span style={styles.avatarIcon}>👤</span>
            <span style={styles.userName}>
              {currentUser.name || "Student"}
            </span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      {/* OUTLET: Nơi nhúng nội dung của các trang con vào */}
      <main style={styles.mainContent}>
        <Outlet /> 
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f4f5f7", // Nền tổng thể màu xám cực nhạt cho dễ nhìn
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "12px 24px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)", // Đổ bóng nhẹ phía dưới
    position: "sticky", // Cố định thanh này ở trên cùng khi cuộn
    top: 0,
    zIndex: 1000,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#0d47a1", // Màu xanh dương đậm giống trong ảnh
    fontSize: "22px",
    fontWeight: "700",
    gap: "8px",
  },
  icon: {
    fontSize: "24px",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  avatarIcon: {
    fontSize: "18px",
    color: "#424242",
  },
  userName: {
    color: "#0d47a1", // Cùng màu với logo
    fontSize: "16px",
    fontWeight: "600",
  },
  logoutBtn: {
    backgroundColor: "#ea4335", // Đỏ chuẩn Google
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  mainContent: {
    paddingBottom: "40px",
  }
};