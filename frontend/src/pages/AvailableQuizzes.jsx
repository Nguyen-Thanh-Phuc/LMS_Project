import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AvailableQuizzes() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const res = await api.get("/enrollments/my-courses");
        setCourses(res.data.data);
      } catch (err) {
        console.error("Error loading courses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #232F3E 0%, #FF9900 100%)",
      padding: "60px 20px",
      fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    },
    header: {
      maxWidth: "1200px",
      margin: "0 auto 50px",
      textAlign: "center",
      color: "#fff",
    },
    title: {
      fontSize: "48px",
      fontWeight: "700",
      margin: "0 0 15px 0",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      fontSize: "18px",
      color: "rgba(255, 255, 255, 0.9)",
      margin: 0,
    },
    coursesGrid: {
      maxWidth: "1200px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "30px",
    },
    courseCard: {
      background: "#fff",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      transform: "translateY(0)",
    },
    courseCardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.25)",
    },
    courseHeader: {
      background: "linear-gradient(135deg, #146EB4 0%, #FF9900 100%)",
      padding: "25px",
      color: "#fff",
    },
    courseIcon: {
      fontSize: "40px",
      marginBottom: "10px",
    },
    courseTitle: {
      fontSize: "22px",
      fontWeight: "700",
      margin: "0 0 5px 0",
      color: "#fff",
    },
    courseDescription: {
      fontSize: "14px",
      color: "rgba(255, 255, 255, 0.9)",
      margin: 0,
    },
    courseBody: {
      padding: "25px",
    },
    stat: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "15px",
      paddingBottom: "15px",
      borderBottom: "1px solid #e0e0e0",
    },
    statLabel: {
      fontWeight: "600",
      color: "#5f6368",
      fontSize: "14px",
    },
    statValue: {
      fontWeight: "700",
      color: "#146EB4",
      fontSize: "14px",
    },
    badgeContainer: {
      marginBottom: "20px",
    },
    badge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    badgeActive: {
      background: "#e8f5e9",
      color: "#2e7d32",
    },
    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#FF9900",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      textDecoration: "none",
      display: "inline-block",
      textAlign: "center",
    },
    buttonHover: {
      backgroundColor: "#ec7211",
      boxShadow: "0 4px 12px rgba(255, 153, 0, 0.3)",
    },
    loadingContainer: {
      textAlign: "center",
      color: "#fff",
      padding: "60px 20px",
    },
    loadingText: {
      fontSize: "18px",
      fontWeight: "600",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>⏳ Loading your courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 My Enrolled Courses</h1>
        <p style={styles.subtitle}>Track your progress and take quizzes to master each course</p>
      </div>

      <div style={styles.coursesGrid}>
        {courses.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#fff", padding: "60px 20px" }}>
            <p style={{ fontSize: "20px", fontWeight: "600" }}>You haven't enrolled in any courses yet</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course._id}>
              <Link to={`/courses/${course._id}/quizzes`} style={{ textDecoration: "none" }}>
                <div 
                  style={styles.courseCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = styles.courseCardHover.transform;
                    e.currentTarget.style.boxShadow = styles.courseCardHover.boxShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = styles.courseCard.transform;
                    e.currentTarget.style.boxShadow = styles.courseCard.boxShadow;
                  }}
                >
                  <div style={styles.courseHeader}>
                    <div style={styles.courseIcon}>🎓</div>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <p style={styles.courseDescription}>{course.description?.substring(0, 50)}...</p>
                  </div>

                  <div style={styles.courseBody}>
                    <div style={styles.badgeContainer}>
                      <span style={{ ...styles.badge, ...styles.badgeActive }}>
                        ✓ Active
                      </span>
                    </div>

                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Total Lessons</span>
                      <span style={styles.statValue}>{course.lessons?.length || 0}</span>
                    </div>

                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Available Quizzes</span>
                      <span style={styles.statValue}>{course.quizzes?.length || 0}</span>
                    </div>

                    <button 
                      style={styles.button}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = styles.buttonHover.backgroundColor;
                        e.target.style.boxShadow = styles.buttonHover.boxShadow;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#FF9900";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      View Quizzes →
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}