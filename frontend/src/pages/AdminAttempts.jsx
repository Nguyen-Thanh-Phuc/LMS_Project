import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";

export default function AdminAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAttempts();
  }, [page, limit, filterStatus, filterCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses", { params: { limit: 100 } });
      setCourses(res.data.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (filterStatus) params.passed = filterStatus === "passed";
      if (filterCourse) params.courseId = filterCourse;
      const res = await api.get("/admin/attempts", { params });
      setAttempts(res.data.data);
      setTotal(res.data.pagination.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching attempts:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || "Failed to fetch attempts");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const handleViewDetails = async (attempt) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/attempts/${attempt._id}`);
      setSelectedAttempt(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching attempt details:", err);
      setError(err.response?.data?.message || "Failed to fetch attempt details");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return <div className="loading">Loading attempts...</div>;

  return (
    <div className="admin-table">
      <h2>Quiz Attempts Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="limit-select"
        >
          <option value="">All Attempts</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterCourse}
          onChange={(e) => {
            setFilterCourse(e.target.value);
            setPage(1);
          }}
          className="limit-select"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="limit-select"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Pass Score</th>
              <th>Status</th>
              <th>Attempted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt._id}>
                  <td>{attempt.userId?.name || "Unknown"}</td>
                <td>{attempt.quizId?.title || "Unknown"}</td>
                <td className="stat">{attempt.score}</td>
                <td className="stat">{attempt.quizId?.passingScore != null ? `${attempt.quizId.passingScore}%` : "N/A"}</td>
                <td>
                  <span
                    className={`status ${
                      attempt.passed ? "status-passed" : "status-failed"
                    }`}
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </td>
                <td>{new Date(attempt.createdAt).toLocaleString()}</td>
                <td className="actions">
                  <button
                    className="btn-small btn-primary"
                    onClick={() => handleViewDetails(attempt)}
                    disabled={loadingDetails}
                  >
                    {loadingDetails ? "Loading..." : "Details"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn-small"
        >
          ← Previous
        </button>
        <span className="page-info">
          Page {page} of {totalPages} (Total: {total})
        </span>
        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="btn-small"
        >
          Next →
        </button>
      </div>

      {/* Attempt Details Modal */}
      {showModal && selectedAttempt && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Quiz Attempt Details</h2>
              <button 
                style={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={{ marginBottom: "10px" }}>
                <strong>Student:</strong> {selectedAttempt.userId?.name || "Unknown"}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>Quiz:</strong> {selectedAttempt.quizId?.title || "Unknown"}
              </div>

              {selectedAttempt.quizId?.questions?.length > 0 ? (
                <div style={styles.answersList}>
                  {selectedAttempt.quizId.questions.map((question, idx) => {
                    const normalizeId = (v) => {
                      if (!v) return null;
                      if (typeof v === "object") return v._id?.toString?.() || v.toString?.();
                      return v.toString?.();
                    };

                    const answerById = selectedAttempt.answers?.find((a) =>
                      normalizeId(a?.questionId) === normalizeId(question?._id)
                    );

                    const answerByIndex = selectedAttempt.answers?.[idx];
                    const answered = answerById || answerByIndex;

                    let selectedText = "(No answer submitted)";
                    if (answered) {
                      const sel = answered.selectedOption;
                      if (typeof sel === "number") {
                        selectedText =
                          question.options?.[sel] ??
                          `Option ${sel + 1}`;
                      } else if (typeof sel === "string" && sel.trim() !== "") {
                        selectedText = sel;
                      }
                      // if sel is null/undefined, keep "(No answer submitted)"
                    }

                    return (
                      <div key={question._id ?? idx} style={styles.answerRow}>
                        <div style={styles.answerQuestion}>
                          {question.questionText || "Question text not available"}
                        </div>
                        <div style={styles.answerMeta}>
                          <div>
                            <strong>Your answer:</strong>{" "}
                            <span>{selectedText}</span>
                            {answered ? (
                              answered.isCorrect ? (
                                <span style={styles.correctTag}> ✓</span>
                              ) : (
                                <span style={styles.incorrectTag}> ✕</span>
                              )
                            ) : null}
                          </div>
                          {!answered && selectedAttempt.answers?.length > 0 && (
                            <div style={{ fontSize: "0.85rem", color: "#999", marginTop: "6px" }}>
                              (Answer exists but could not be linked to this question)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              ) : (
                <div style={{ padding: "10px 0", color: "#666" }}>
                  No question bank data available for this quiz.
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.btnClose}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    padding: "20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
  },
  modalContent: {
    padding: "20px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  answersList: {
    padding: "10px 0",
  },
  answerRow: {
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid #f0f0f0",
    borderRadius: "6px",
    backgroundColor: "#fafafa",
  },
  answerQuestion: {
    fontWeight: "600",
    marginBottom: "6px",
    color: "#333",
  },
  answerMeta: {
    fontSize: "0.95rem",
    lineHeight: "1.4",
    color: "#444",
  },
  correctTag: {
    marginLeft: "8px",
    color: "#4CAF50",
    fontWeight: "700",
  },
  incorrectTag: {
    marginLeft: "8px",
    color: "#f44336",
    fontWeight: "700",
  },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
  },
  btnClose: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
