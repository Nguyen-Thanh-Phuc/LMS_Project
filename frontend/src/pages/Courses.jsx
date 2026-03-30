import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Retrieve current logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={{ color: "#5f6368", fontWeight: "400" }}>Loading courses...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Available Courses</h1>
        <p style={styles.subtitle}>Explore and enroll in new classes to enhance your skills</p>
      </div>

      {courses.length === 0 ? (
        <div style={styles.emptyState}>No courses found at the moment.</div>
      ) : (
        <div style={styles.grid}>
          {courses.map((course) => {
            // FIX LỖI: Kiểm tra an toàn currentUser và format của studentsEnrolled
            const currentUserId = currentUser?._id || currentUser?.id;
            const isEnrolled = Boolean(
              currentUserId && 
              course.studentsEnrolled?.some((student) => {
                const studentId = typeof student === 'string' ? student : student?._id;
                return studentId === currentUserId;
              })
            );

            return (
              <div
                key={course._id}
                style={{
                  ...styles.card,
                  opacity: isEnrolled ? 0.75 : 1, // Dim the card slightly if enrolled
                }}
              >
                {/* ENROLLED BADGE */}
                {isEnrolled && (
                  <div style={styles.enrolledBadge}>
                    <span style={{ marginRight: "4px", fontSize: "14px" }}>✓</span> Enrolled
                  </div>
                )}

                <img
                  src={course.thumbnail || "https://via.placeholder.com/300x150?text=Course+Image"}
                  alt={course.title}
                  style={styles.image}
                />

                <div style={styles.content}>
                  <h2 style={styles.courseTitle} title={course.title}>
                    {course.title.length > 40 ? course.title.substring(0, 40) + "..." : course.title}
                  </h2>
                  
                  <div style={styles.instructorInfo}>
                    <div style={styles.avatar}>
                      {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span style={styles.instructorName}>
                      {course.instructor?.name || "Unknown Instructor"}
                    </span>
                  </div>

                  <p style={styles.description}>
                    {course.description?.length > 80
                      ? course.description.substring(0, 80) + "..."
                      : course.description}
                  </p>

                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    style={{
                      ...styles.button,
                      backgroundColor: isEnrolled ? "#e8f0fe" : "#1a73e8",
                      color: isEnrolled ? "#1967d2" : "#fff",
                      border: isEnrolled ? "1px solid #d2e3fc" : "none",
                    }}
                  >
                    {isEnrolled ? "Go to Class" : "View Details"}
                  </button>
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
    backgroundColor: "#f0f2f5", // Consistent light gray background
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
    position: "relative",
    transition: "box-shadow 0.3s ease, transform 0.2s ease",
    display: "flex",
    flexDirection: "column",
  },
  enrolledBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "rgba(25, 103, 210, 0.9)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    zIndex: 2,
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
    flexGrow: 1, // Pushes the button to the bottom
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "auto", // Align bottom
  },
};