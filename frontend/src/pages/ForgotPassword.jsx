import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      alert("Reset email sent! Please check your inbox.");
    } catch (error) {
      alert(error.response?.data?.message || "Error sending email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your registered email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer"}} 
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div style={styles.links}>
            <Link to="/" style={styles.linkLogin}>Back to Sign In</Link>
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
    minHeight: "100vh",
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: "10px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f3f4",
  },
  linkLogin: {
    color: "#1a73e8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "6px 12px",
    backgroundColor: "#f4f8fe",
    borderRadius: "4px",
  },
};

export default ForgotPassword;