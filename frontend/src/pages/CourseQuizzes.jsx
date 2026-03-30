import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CourseQuizzes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data?.data || null);

        const quizRes = await api.get(`/quizzes/course/${id}`);
        setQuizzes(Array.isArray(quizRes.data?.data) ? quizRes.data.data : []);

        const attemptRes = await api.get(`/attempts/my/course/${id}`);
        setAttempts(Array.isArray(attemptRes.data?.data) ? attemptRes.data.data : []);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setQuizzes([]);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ Create map of latest attempt per quiz
  const latestAttemptsMap = useMemo(() => {
    const map = {};

    attempts.forEach((attempt) => {
      const quizId =
        typeof attempt.quizId === "object"
          ? attempt.quizId._id
          : attempt.quizId;

      if (!map[quizId]) {
        map[quizId] = attempt;
      } else {
        // keep latest attempt
        if (new Date(attempt.createdAt) > new Date(map[quizId].createdAt)) {
          map[quizId] = attempt;
        }
      }
    });

    return map;
  }, [attempts]);

  // ✅ Count unique quizzes passed
  const passedCount = Object.values(latestAttemptsMap).filter(
    (attempt) => attempt.passed === true
  ).length;

  const progress =
    quizzes.length > 0
      ? Math.round((passedCount / quizzes.length) * 100)
      : 0;

  const getQuizStatus = (quizId) => {
    const attempt = latestAttemptsMap[quizId];

    if (!attempt) return "not-started";
    return attempt.passed ? "completed" : "failed";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        ⏳ Loading quizzes...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 style={styles.pageTitle}>
        📝 {course?.title || "Course Quizzes"}
      </h1>

      {/* Progress */}
      <div style={styles.progressSection}>
        <div style={styles.progressLabel}>Your Progress</div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>

        <div style={styles.progressStats}>
          <span>
            {passedCount} of {quizzes.length} quizzes completed
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Quizzes */}
      <div style={styles.quizzesContainer}>
        {quizzes.length === 0 ? (
          <div style={styles.emptyState}>
            No quizzes available for this course.
          </div>
        ) : (
          <div style={styles.quizGrid}>
            {quizzes.map((quiz, index) => {
              const status = getQuizStatus(quiz._id);

              return (
                <div key={quiz._id} style={styles.quizCard}>
                  <div
                    style={{
                      ...styles.quizHeaderBadge,
                      ...(status === "completed"
                        ? styles.badgeCompleted
                        : status === "failed"
                        ? styles.badgeFailed
                        : styles.badgeNotStarted),
                    }}
                  >
                    {status === "completed"
                      ? "✓ Passed"
                      : status === "failed"
                      ? "✗ Failed"
                      : "Not Taken"}
                  </div>

                  <div style={styles.quizNumber}>
                    Quiz {index + 1}
                  </div>

                  <div style={styles.quizTitle}>
                    {quiz.title}
                  </div>

                  <div style={styles.quizQuestionCount}>
                    {quiz.questions?.length || 0} questions • Pass:{" "}
                    {quiz.passingScore}%
                  </div>

                  <Link to={`/quiz/${quiz._id}`}>
                    <button style={styles.button}>
                      {status === "completed"
                        ? "Review"
                        : status === "failed"
                        ? "Retake"
                        : "Take Quiz"}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================= */
/* STYLES */
/* ========================= */

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "20px",
  },
  backButton: {
    marginBottom: "20px",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#e5e7eb",
    cursor: "pointer",
  },
  progressSection: {
    marginBottom: "30px",
  },
  progressLabel: {
    fontWeight: "600",
    marginBottom: "8px",
  },
  progressBar: {
    width: "100%",
    height: "12px",
    backgroundColor: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    transition: "width 0.4s ease",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  quizzesContainer: {
    marginTop: "20px",
  },
  quizGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  quizCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  quizHeaderBadge: {
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "10px",
  },
  badgeCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeFailed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeNotStarted: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  quizNumber: {
    fontSize: "12px",
    color: "#6b7280",
  },
  quizTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "6px 0",
  },
  quizQuestionCount: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "10px",
  },
  button: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "60px",
  },
};