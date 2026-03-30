import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const accessToken =
        response.data.accessToken || response.data.token;

      const refreshToken = response.data.refreshToken || null;
      const user = response.data.user;

      if (!accessToken || !user) {
        throw new Error("Invalid login response from server");
      }

      // ✅ Save everything
      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      localStorage.setItem("user", JSON.stringify(user));

      // Redirect by role
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/student-dashboard", { replace: true });
      }

    } catch (error) {
      console.error("Login error:", error);
      alert(
        error.response?.data?.message ||
        error.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>System Login</h2>
          <p style={styles.subtitle}>Sign in to your LMS account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer"}} 
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={styles.links}>
            <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
            <Link to="/register" style={styles.linkRegister}>Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5", 
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", 
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#1a73e8", 
    fontSize: "28px",
    fontWeight: "600",
  },
  subtitle: {
    margin: 0,
    color: "#5f6368",
    fontSize: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#3c4043",
    fontWeight: "500",
  },
  input: {
    padding: "12px 15px",
    fontSize: "15px",
    borderRadius: "4px",
    border: "1px solid #dadce0",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    width: "100%",
  },
  button: {
    padding: "12px",
    backgroundColor: "#1a73e8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "10px",
    transition: "background-color 0.2s",
  },
  links: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f3f4",
  },
  link: {
    color: "#1a73e8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  linkRegister: {
    color: "#1a73e8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 15px",
    backgroundColor: "#f4f8fe",
    borderRadius: "4px",
  },
};

export default Login;