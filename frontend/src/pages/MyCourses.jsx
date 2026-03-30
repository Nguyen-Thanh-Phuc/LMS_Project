import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function MyCourses() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        // ✅ Fetch ONLY current user's enrollments
        const res = await api.get("/enrollments/my");

        // enrollment contains populated courseId
        const enrollments = res.data.data;

        // extract courses from enrollments
        const enrolledCourses = enrollments.map(
          (enrollment) => enrollment.courseId
        );

        setMyCourses(enrolledCourses);
      } catch (error) {
        console.error("Error fetching my courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={{ color: "#5f6368", fontWeight: "400" }}>
          Loading your classes...
        </h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Classes</h1>
        <p style={styles.subtitle}>
          Welcome back! Continue your learning journey.
        </p>
      </div>

      {myCourses.length === 0 ? (
        <div style={styles.emptyState}>
          You haven't enrolled in any courses yet.
        </div>
      ) : (
        <div style={styles.grid}>
          {myCourses.map((course) => (
            <div key={course._id} style={styles.card}>
              <img
                src={
                  course.thumbnail ||
                  "https://via.placeholder.com/300x150?text=Course+Image"
                }
                alt={course.title}
                style={styles.image}
              />

              <div style={styles.content}>
                <h2 style={styles.courseTitle}>
                  {course.title}
                </h2>

                <p style={styles.description}>
                  {course.description}
                </p>

                <button
                  onClick={() => navigate(`/my-courses/${course._id}`)}
                  style={styles.button}
                >
                  Enter Class
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    color: "#1a73e8",
    margin: "0 0 10px 0",
    fontWeight: "400",
  },
  subtitle: {
    fontSize: "16px",
    color: "#5f6368",
    margin: 0,
  },
  emptyState: {
    textAlign: "center",
    color: "#5f6368",
    fontSize: "16px",
    marginTop: "50px",
    fontStyle: "italic",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  card: {
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#fff",
    border: "1px solid #dadce0",
    transition: "box-shadow 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  image: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderBottom: "1px solid #dadce0",
  },
  content: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  courseTitle: {
    fontSize: "20px",
    color: "#1967d2",
    margin: "0 0 15px 0",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  instructorInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#1a73e8",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "bold",
  },
  instructorName: {
    fontSize: "14px",
    color: "#3c4043",
    fontWeight: "500",
  },
  description: {
    fontSize: "14px",
    color: "#5f6368",
    lineHeight: "1.5",
    margin: "0 0 20px 0",
    flexGrow: 1,
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    marginTop: "auto",
  },
};