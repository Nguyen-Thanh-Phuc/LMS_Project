import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoryAndProfile = async () => {
      setLoading(true);

      // If email is missing in local user, refresh from API
      if (!user?.email && (user?.id || user?._id)) {
        const userId = user.id || user._id;
        try {
          const userRes = await api.get(`/users/${userId}`);
          if (userRes.data?.data) {
            const updatedUser = userRes.data.data;
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error("Error fetching user info:", err);
        }
      }

      try {
        const res = await api.get("/enrollments/my/history");
        setHistory(res.data.data || []);
      } catch (err) {
        console.error("Error fetching enrollment history:", err);
        setError(err.response?.data?.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryAndProfile();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <p style={styles.subtitle}>Track your learning history and certificates.</p>
      </div>

      <div style={styles.profileCard}>
        <div>
          <div style={styles.avatar}>{(user?.name || "?")[0] || "?"}</div>
          <div>
            <h2 style={styles.name}>{user?.name || "Student"}</h2>
            <p style={styles.email}>{user?.email || "No email"}</p>
          </div>
        </div>

        <button
          style={styles.editButton}
          onClick={() => navigate("/my-courses")}
        >
          View My Courses
        </button>
      </div>

      <div style={styles.historyHeader}>
        <h2 style={styles.historyTitle}>Learning History</h2>
        <p style={styles.historyDesc}>
          Your enrolled courses, progress, and certificate status.
        </p>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading history…</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : history.length === 0 ? (
        <div style={styles.empty}>No courses found yet.</div>
      ) : (
        <div style={styles.grid}>
          {history.map((enrollment) => {
            const course = enrollment.courseId || {};
            const hasCertificate = Boolean(enrollment.certificate);
            const finished = enrollment.isCompleted || hasCertificate;

            return (
              <div key={enrollment._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>{course.title || "Unknown Course"}</div>
                  <div style={styles.statusBadge(finished)}>
                    {finished ? "Finished" : "In Progress"}
                  </div>
                </div>

                <p style={styles.cardDescription}>{course.description || "No description"}</p>

                <div style={styles.cardFooter}>
                  <div style={styles.courseInfo}>
                    <div>
                      <span style={styles.label}>Enrolled</span>
                      <span style={styles.value}>
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span style={styles.label}>Progress</span>
                      <span style={styles.value}>
                        {Math.round(enrollment.progress?.percentage || 0)}%
                      </span>
                    </div>
                  </div>

                  <div style={styles.actions}>
                    {hasCertificate && (
                      <button
                        style={styles.certificateButton}
                        onClick={() =>
                          navigate(
                            `/my-courses/${course._id}?downloadCertificate=${enrollment.certificate._id}`
                          )
                        }
                      >
                        View Certificate
                      </button>
                    )}

                    <button
                      style={styles.actionButton}
                      onClick={() => navigate(`/my-courses/${course._id}`)}
                    >
                      Open Course
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    background: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "32px",
    margin: 0,
    color: "#1a73e8",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#5f6368",
    fontSize: "16px",
  },
  profileCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    borderRadius: "12px",
    padding: "22px 26px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    marginBottom: "28px",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#1a73e8",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    marginRight: "18px",
  },
  name: {
    margin: 0,
    fontSize: "22px",
    color: "#1f2937",
  },
  email: {
    margin: "4px 0 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  editButton: {
    padding: "12px 22px",
    background: "#1a73e8",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },
  historyHeader: {
    marginBottom: "22px",
  },
  historyTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1a202c",
  },
  historyDesc: {
    margin: "8px 0 0 0",
    color: "#4b5563",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    color: "#dc2626",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  statusBadge: (finished) => ({
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    color: finished ? "#1b5e20" : "#1e3a8a",
    background: finished ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.12)",
  }),
  cardDescription: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },
  courseInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  actionButton: {
    padding: "10px 16px",
    background: "#1a73e8",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  certificateButton: {
    padding: "10px 16px",
    background: "#16a34a",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
};
