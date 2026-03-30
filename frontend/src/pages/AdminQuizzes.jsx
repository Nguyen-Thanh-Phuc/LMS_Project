import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterCourse, setFilterCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
  }, [page, limit, filterCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses", { params: { limit: 100 } });
      setCourses(res.data.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (filterCourse) params.courseId = filterCourse;
      const res = await api.get("/admin/quizzes", { params });
      setQuizzes(res.data.data);
      setTotal(res.data.pagination.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = async (quiz) => {
    try {
      // Fetch full quiz details including questions
      const res = await api.get(`/quizzes/${quiz._id}`);
      setEditingQuiz(res.data.data);
      setShowEditModal(true);
    } catch (err) {
      console.error("Error fetching quiz details:", err);
      alert("Failed to load quiz details for editing");
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      return;
    }

    try {
      await api.delete(`/quizzes/${quiz._id}`);
      alert("Quiz deleted successfully!");
      fetchQuizzes(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete quiz");
    }
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz.title.trim()) {
      alert("Quiz title is required");
      return;
    }

    if (!editingQuiz.passingScore || editingQuiz.passingScore < 0 || editingQuiz.passingScore > 100) {
      alert("Passing score must be between 0 and 100");
      return;
    }

    // Validate questions
    if (!editingQuiz.questions || editingQuiz.questions.length === 0) {
      alert("Quiz must have at least one question");
      return;
    }

    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const question = editingQuiz.questions[i];
      if (!question.questionText?.trim()) {
        alert(`Question ${i + 1} text is required`);
        return;
      }
      if (!question.options || question.options.length < 2) {
        alert(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        alert(`Question ${i + 1} must have a correct answer selected`);
        return;
      }
      // Check if all options have text
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j]?.trim()) {
          alert(`Question ${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty`);
          return;
        }
      }
    }

    // Check if quiz has attempts - if so, backend will reject the update
    const hasAttempts = editingQuiz.stats?.totalAttempts > 0;
    if (hasAttempts) {
      alert("Cannot edit quiz that has been attempted by students");
      return;
    }

    try {
      // Strip out createdBy and other fields that shouldn't be sent in updates
      const questionsToSend = editingQuiz.questions.map(question => ({
        _id: question._id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer
      }));

      await api.put(`/quizzes/${editingQuiz._id}`, {
        title: editingQuiz.title,
        passingScore: editingQuiz.passingScore,
        questions: questionsToSend
      });

      alert("Quiz updated successfully!");
      setShowEditModal(false);
      setEditingQuiz(null);
      fetchQuizzes(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update quiz");
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="loading">Loading quizzes...</div>;

  return (
    <div className="admin-table">
      <h2>Quizzes Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filterCourse}
          onChange={(e) => {
            setFilterCourse(e.target.value);
            setPage(1);
          }}
          className="limit-select"
        >
          <option value="">All Courses</option>
          <option value="bank">In Bank</option>
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
              <th>Title</th>
              <th>Course</th>
              <th>Questions</th>
              <th>Pass Score</th>
              <th>Attempts</th>
              <th>Pass Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz._id}>
                <td>{quiz.title}</td>
                <td>{quiz.courseId?.title || "N/A"}</td>
                <td className="stat">{quiz.questionCount || 0}</td>
                <td className="stat">{quiz.passingScore ?? quiz.passScore ?? 0}%</td>
                <td className="stat">{quiz.stats?.totalAttempts || 0}</td>
                <td className="stat">
                  {quiz.stats?.passRate ? `${quiz.stats.passRate}%` : "N/A"}
                </td>
                <td className="actions">
                  <button 
                    className="btn-small btn-primary"
                    onClick={() => handleEditQuiz(quiz)}
                    style={{ marginRight: "8px" }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-small btn-danger"
                    onClick={() => handleDeleteQuiz(quiz)}
                  >
                    Delete
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

      {/* Edit Quiz Modal */}
      {showEditModal && editingQuiz && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Edit Quiz</h2>
              <button 
                style={styles.closeBtn}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              {(() => {
                const hasAttempts = editingQuiz.stats?.totalAttempts > 0;
                return (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Quiz Title:</label>
                      <input
                        type="text"
                        value={editingQuiz.title || ""}
                        onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                        style={{...styles.input, ...(hasAttempts ? styles.disabledInput : {})}}
                        placeholder="Enter quiz title"
                        disabled={hasAttempts}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Passing Score (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingQuiz.passingScore || 0}
                        onChange={(e) => setEditingQuiz({ ...editingQuiz, passingScore: parseInt(e.target.value) || 0 })}
                        style={{...styles.input, ...(hasAttempts ? styles.disabledInput : {})}}
                        disabled={hasAttempts}
                      />
                          </div>

                    <div style={styles.quizInfo}>
                      <p><strong>Course:</strong> {editingQuiz.courseId?.title || "N/A"}</p>
                      <p><strong>Questions:</strong> {editingQuiz.questions?.length || 0}</p>
                      <p><strong>Total Attempts:</strong> {editingQuiz.stats?.totalAttempts || 0}</p>
                    </div>

                    {/* Display/Edit Questions with Numbers */}
                    {editingQuiz.questions && editingQuiz.questions.length > 0 && (
                      <div style={styles.questionsList}>
                        <div style={styles.questionsHeader}>
                          <h3>Questions:</h3>
                        </div>
                        {editingQuiz.questions.map((question, index) => (
                          <div key={question._id || index} style={styles.questionItem}>
                            <div style={styles.questionHeader}>
                              <strong>Question {index + 1}:</strong>
                              {!hasAttempts && editingQuiz.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedQuestions = editingQuiz.questions.filter((_, i) => i !== index);
                                    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                                  }}
                                  style={styles.removeButton}
                                >
                                  Delete Question
                                </button>
                              )}
                            </div>
                            {hasAttempts ? (
                              <div>{question.questionText}</div>
                            ) : (
                              <input
                                type="text"
                                value={question.questionText || ""}
                                onChange={(e) => {
                                  const updatedQuestions = [...editingQuiz.questions];
                                  updatedQuestions[index] = { ...question, questionText: e.target.value };
                                  setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                                }}
                                style={styles.questionInput}
                                placeholder="Enter question text"
                              />
                            )}
                            <div style={styles.optionsList}>
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} style={styles.optionRow}>
                                  {hasAttempts ? (
                                    <div style={{
                                      ...styles.optionItem,
                                      ...(optIndex === question.correctAnswer ? styles.correctOption : {})
                                    }}>
                                      {String.fromCharCode(65 + optIndex)}) {option}
                                      {optIndex === question.correctAnswer && <span style={styles.correctMark}> ✓</span>}
                                    </div>
                                  ) : (
                                    <>
                                      <input
                                        type="radio"
                                        name={`correct-${index}`}
                                        checked={optIndex === question.correctAnswer}
                                        onChange={() => {
                                          const updatedQuestions = [...editingQuiz.questions];
                                          updatedQuestions[index] = { ...question, correctAnswer: optIndex };
                                          setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                                        }}
                                        style={styles.radioInput}
                                      />
                                      <input
                                        type="text"
                                        value={option || ""}
                                        onChange={(e) => {
                                          const updatedQuestions = [...editingQuiz.questions];
                                          const updatedOptions = [...(question.options || [])];
                                          updatedOptions[optIndex] = e.target.value;
                                          updatedQuestions[index] = { ...question, options: updatedOptions };
                                          setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                                        }}
                                        style={styles.optionInput}
                                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                      />
                                      {optIndex === question.correctAnswer && <span style={styles.correctMark}> ✓ Correct</span>}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasAttempts ? (
                      <div style={styles.error}>
                        ❌ This quiz has been attempted by students and cannot be edited.
                      </div>
                    ) : (
                      <div style={styles.warning}>
                        ⚠️ Note: You cannot edit questions or change the course after the quiz has been attempted by students.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.btnCancel}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.btnSave}
                onClick={handleSaveQuiz}
              >
                Save Changes
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
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "600",
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
    cursor: "not-allowed",
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "14px",
    border: "1px solid #f5c6cb",
  },
  quizInfo: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "15px",
  },
  warning: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "14px",
    border: "1px solid #ffeaa7",
  },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  btnCancel: {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  btnSave: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  questionsList: {
    marginTop: "20px",
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid #eee",
    borderRadius: "4px",
    padding: "15px",
  },
  questionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  questionItem: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    border: "1px solid #dee2e6",
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  questionInput: {
    width: "100%",
    padding: "8px",
    marginTop: "5px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  optionsList: {
    marginLeft: "0",
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    gap: "10px",
  },
  radioInput: {
    margin: "0",
  },
  optionInput: {
    flex: 1,
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  optionItem: {
    marginBottom: "5px",
    padding: "4px 8px",
    backgroundColor: "#fff",
    border: "1px solid #dee2e6",
    borderRadius: "3px",
  },
  correctOption: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    fontWeight: "bold",
  },
  correctMark: {
    color: "#28a745",
    marginLeft: "8px",
    fontWeight: "bold",
  },
  addButton: {
    padding: "6px 12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  removeButton: {
    padding: "4px 8px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  addOptionButton: {
    padding: "4px 8px",
    backgroundColor: "#17a2b8",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginTop: "5px",
  },
  removeOptionButton: {
    padding: "2px 6px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "12px",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
