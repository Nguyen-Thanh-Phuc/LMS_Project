import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, check if the user already submitted this quiz
        const attemptRes = await api.get(`/attempts/my/${id}`);
        const userAttempt = attemptRes.data.data;

        if (userAttempt) {
          // Review mode (no resubmits allowed)
          setAttempt(userAttempt);

          const quizData = userAttempt.quizId;
          setQuiz(quizData);

          const answersMap = new Map(
            userAttempt.answers.map((a) => [a.questionId.toString(), a.selectedOption])
          );
          const initialAnswers = quizData.questions.map(
            (q) => answersMap.get(q._id.toString()) ?? null
          );
          setAnswers(initialAnswers);

          setResult({
            score: userAttempt.score,
            passed: userAttempt.passed,
            attemptNumber: userAttempt.attemptNumber,
            percentage: userAttempt.percentage,
            passingScore: quizData.passingScore
          });

          return;
        }

        // No attempt yet; load quiz for taking
        const res = await api.get(`/quizzes/${id}`);
        const quizData = res.data.data;
        setQuiz(quizData);

        if (quizData && quizData.questions) {
          setAnswers(new Array(quizData.questions.length).fill(null));
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        alert("Failed to load quiz. Please try again!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSelectOption = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      const confirmSubmit = window.confirm(
        "You haven't answered all questions. Do you want to submit anyway?"
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${id}/submit`, { answers });
      setResult(res.data.data);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      const message = err.response?.data?.message;

      // If quiz has already been submitted, fetch attempt to show review
      if (message && message.includes("already submitted")) {
        try {
          const attemptRes = await api.get(`/attempts/my/${id}`);
          const userAttempt = attemptRes.data.data;
          if (userAttempt) {
            setAttempt(userAttempt);
            const quizData = userAttempt.quizId;
            setQuiz(quizData);

            const answersMap = new Map(
              userAttempt.answers.map((a) => [a.questionId.toString(), a.selectedOption])
            );
            const initialAnswers = quizData.questions.map(
              (q) => answersMap.get(q._id.toString()) ?? null
            );
            setAnswers(initialAnswers);

            setResult({
              score: userAttempt.score,
              passed: userAttempt.passed,
              attemptNumber: userAttempt.attemptNumber,
              percentage: userAttempt.percentage,
              passingScore: quizData.passingScore
            });
          }
        } catch (fetchErr) {
          console.error("Error fetching existing attempt:", fetchErr);
        }
      }

      alert(message || "Error submitting quiz!");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercentage = quiz ? Math.round((answeredCount / quiz.questions.length) * 100) : 0;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Quiz not found!</p>
        </div>
      </div>
    );
  }

  // ========== RESULT SCREEN ==========
  if (result) {
    const passed = result.passed;
    const scorePercentage = result.score;

    return (
      <div style={styles.containerResult}>
        <div style={styles.certificateCard}>
          <div style={styles.certificateHeader}>
            <div style={styles.certificateBadge}>
              {passed ? "🏆 CERTIFICATION" : "📋 ASSESSMENT COMPLETE"}
            </div>
          </div>

          <div style={styles.certificateContent}>
            <div style={styles.resultIcon}>
              {passed ? "✨" : "📊"}
            </div>

            <h2 style={{
              ...styles.resultTitle,
              color: passed ? "#4CAF50" : "#FF9900"
            }}>
              {passed ? "CONGRATULATIONS!" : "ASSESSMENT COMPLETE"}
            </h2>

            <p style={styles.resultMessage}>
              {passed 
                ? "You have successfully completed this quiz!" 
                : "Review the material and try again to improve your score."}
            </p>

            <div style={styles.scoreCard}>
              <div style={styles.scoreBigNumber}>{scorePercentage}</div>
              <div style={styles.scoreLabel}>out of 100</div>
              <div style={styles.scoreRequirement}>
                Passing: {quiz.passingScore}% • Attempt: {result.attemptNumber}
              </div>
            </div>

            {attempt && (
              <div style={styles.reviewContainer}>
                <h3 style={styles.reviewTitle}>Your submission</h3>
                {quiz.questions.map((question, qIndex) => {
                  const answerEntry = attempt.answers.find(
                    (a) => a.questionId.toString() === question._id.toString()
                  );
                  const selected = answerEntry?.selectedOption;
                  const isCorrect = answerEntry?.isCorrect;

                  return (
                    <div key={question._id} style={styles.reviewQuestion}>
                      <div style={styles.reviewQuestionHeader}>
                        <span style={styles.reviewQuestionNumber}>Q{qIndex + 1}</span>
                        <span style={{
                          ...styles.reviewStatus,
                          backgroundColor: isCorrect ? "#d4edda" : "#ffe8e6",
                          color: isCorrect ? "#155724" : "#842029"
                        }}>
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <div style={styles.reviewQuestionText}>{question.questionText}</div>

                      <div style={styles.reviewOptions}>
                        {question.options.map((opt, optIndex) => {
                          const isSelected = selected === optIndex;
                          const isAnswer = optIndex === question.correctAnswer;

                          return (
                            <div
                              key={optIndex}
                              style={{
                                ...styles.reviewOption,
                                borderColor: isSelected ? "#1a73e8" : "#e0e0e0",
                                backgroundColor: isSelected
                                  ? isAnswer
                                    ? "rgba(76, 175, 80, 0.12)"
                                    : "rgba(244, 67, 54, 0.12)"
                                  : isAnswer
                                  ? "rgba(76, 175, 80, 0.08)"
                                  : "#fff"
                              }}
                            >
                              <span style={styles.reviewOptionLabel}>
                                {isSelected ? "✅" : "○"}
                              </span>
                              <span>{opt}</span>
                              {isAnswer && (
                                <span style={styles.correctBadge}>Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.progressBarResult}>
              <div 
                style={{
                  ...styles.progressFillResult,
                  width: `${scorePercentage}%`,
                  background: passed 
                    ? "linear-gradient(90deg, #4CAF50 0%, #45a049 100%)"
                    : "linear-gradient(90deg, #FF9900 0%, #FFB84D 100%)"
                }}
              ></div>
            </div>

            <div style={styles.resultButtonGroup}>
              {!attempt && !passed && (
                <button 
                  onClick={() => window.location.reload()} 
                  style={styles.retakeBtn}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 8px 20px rgba(255, 153, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.2)";
                  }}
                >
                  🔄 Retake Quiz
                </button>
              )}
              <button 
                onClick={() => {
                  const courseId =
                    attempt?.courseId?._id ||
                    attempt?.courseId ||
                    quiz?.courseId?._id ||
                    quiz?.courseId;
                  navigate(courseId ? `/my-courses/${courseId}` : "/my-courses");
                }}
                style={passed ? styles.successBtn : styles.secondaryBtn}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = passed 
                    ? "0 8px 20px rgba(76, 175, 80, 0.3)"
                    : "0 8px 20px rgba(20, 110, 180, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = passed
                    ? "0 4px 12px rgba(76, 175, 80, 0.2)"
                    : "0 4px 12px rgba(20, 110, 180, 0.2)";
                }}
              >
                {passed ? "✓ Continue" : "← Back to Course"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== QUIZ TAKING SCREEN ==========
  return (
    <div style={styles.container}>
      <div style={styles.quizHeader}>
        <div style={styles.headerTop}>
          <button 
            style={styles.backBtn}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => e.target.style.opacity = "0.8"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            ← Back
          </button>
          
          <div style={styles.quizMeta}>
            <h1 style={styles.quizTitle}>{quiz.title}</h1>
            <p style={styles.quizInfo}>
              {quiz.questions?.length} questions • Passing: {quiz.passingScore}%
            </p>
          </div>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressLabel}>
            Progress: <strong>{answeredCount}/{quiz.questions?.length}</strong>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${progressPercentage}%`
              }}
            ></div>
          </div>
          <div style={styles.progressPercentage}>{progressPercentage}%</div>
        </div>
      </div>

      <div style={styles.questionsContainer}>
        {quiz.questions?.map((q, qIndex) => (
          <div key={q._id} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionBadge}>Question {qIndex + 1} of {quiz.questions.length}</span>
              <span style={styles.questionScore}>Points: 1</span>
            </div>

            <h3 style={styles.questionText}>
              <span style={styles.questionNumber}>Q{qIndex + 1}:</span> {q.questionText}
            </h3>
            
            <div style={styles.optionsContainer}>
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[qIndex] === optIndex;
                return (
                  <label 
                    key={optIndex} 
                    style={{
                      ...styles.optionLabel,
                      borderColor: isSelected ? "#146EB4" : "#dadce0",
                      backgroundColor: isSelected ? "#e3f2fd" : "#ffffff",
                      borderWidth: isSelected ? "2px" : "2px",
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={optIndex}
                      checked={isSelected}
                      onChange={() => handleSelectOption(qIndex, optIndex)}
                      style={{ display: "none" }}
                    />
                    <span style={{
                      ...styles.radioCustom,
                      borderColor: isSelected ? "#146EB4" : "#9aa0a6",
                      backgroundColor: isSelected ? "#146EB4" : "transparent",
                      boxShadow: isSelected ? "0 0 0 4px rgba(20, 110, 180, 0.1)" : "none"
                    }}></span>
                    <span style={styles.optionText}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.submitSection}>
        <div style={styles.submitInfo}>
          <span style={styles.answeredInfo}>
            Answered: <strong>{answeredCount} / {quiz.questions?.length}</strong>
          </span>
          {answers.includes(null) && (
            <span style={styles.warningInfo}>
              ⚠ {quiz.questions?.length - answeredCount} question(s) remaining
            </span>
          )}
        </div>
        <button 
          style={{
            ...styles.submitBtn,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? "not-allowed" : "pointer"
          }}
          onClick={handleSubmit}
          disabled={submitting}
          onMouseEnter={(e) => {
            if (!submitting) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 20px rgba(255, 153, 0, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.2)";
          }}
        >
          {submitting ? "⏳ Grading..." : "✓ Submit Quiz"}
        </button>
      </div>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "100px 20px",
    color: "#232F3E",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(20, 110, 180, 0.2)",
    borderTop: "4px solid #146EB4",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#232F3E",
  },
  errorContainer: {
    textAlign: "center",
    padding: "100px 20px",
  },
  errorText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#d93025",
  },
  quizHeader: {
    maxWidth: "900px",
    margin: "0 auto 40px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "30px",
  },
  backBtn: {
    background: "transparent",
    border: "2px solid #e0e0e0",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#5f6368",
    transition: "all 0.3s ease",
  },
  quizMeta: {
    flex: 1,
  },
  quizTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#202124",
  },
  quizInfo: {
    fontSize: "14px",
    color: "#5f6368",
    margin: 0,
  },
  progressContainer: {
    marginTop: "20px",
  },
  progressLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#5f6368",
    marginBottom: "10px",
  },
  progressBar: {
    width: "100%",
    height: "10px",
    backgroundColor: "#e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "10px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #146EB4 0%, #FF9900 100%)",
    borderRadius: "10px",
    transition: "width 0.4s ease",
  },
  progressPercentage: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#FF9900",
    textAlign: "right",
  },
  questionsContainer: {
    maxWidth: "900px",
    margin: "0 auto 40px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  questionCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e8e8e8",
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #f0f0f0",
  },
  questionBadge: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#146EB4",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: "#e3f2fd",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  questionScore: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#5f6368",
  },
  questionText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#202124",
    margin: "0 0 20px 0",
    lineHeight: "1.6",
  },
  questionNumber: {
    color: "#146EB4",
    fontWeight: "700",
    marginRight: "8px",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  optionLabel: {
    display: "flex",
    alignItems: "flex-start",
    padding: "16px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "2px solid",
  },
  radioCustom: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid",
    marginRight: "14px",
    marginTop: "2px",
    flexShrink: 0,
    transition: "all 0.2s ease",
  },
  optionText: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#202124",
    flex: 1,
  },
  submitSection: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#fff",
    padding: "25px 30px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
    position: "sticky",
    bottom: "20px",
    zIndex: 10,
  },
  submitInfo: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  answeredInfo: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#5f6368",
  },
  warningInfo: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#FF9900",
  },
  submitBtn: {
    padding: "14px 32px",
    backgroundColor: "#FF9900",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(255, 153, 0, 0.2)",
  },

  // Result Screen Styles
  containerResult: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #232F3E 0%, #37475A 50%, #146EB4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
  certificateCard: {
    maxWidth: "600px",
    width: "100%",
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    animation: "slideUp 0.6s ease",
  },
  certificateHeader: {
    background: "linear-gradient(135deg, #146EB4 0%, #FF9900 100%)",
    padding: "40px 30px",
    textAlign: "center",
    color: "#fff",
  },
  certificateBadge: {
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "2px",
    opacity: 0.9,
  },
  certificateContent: {
    padding: "50px 40px",
    textAlign: "center",
  },
  resultIcon: {
    fontSize: "80px",
    marginBottom: "20px",
  },
  resultTitle: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 15px 0",
    letterSpacing: "-0.5px",
  },
  resultMessage: {
    fontSize: "16px",
    color: "#5f6368",
    margin: "0 0 30px 0",
    lineHeight: "1.6",
  },
  scoreCard: {
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    borderRadius: "12px",
    padding: "30px",
    margin: "30px 0",
    border: "2px dashed #146EB4",
  },
  scoreBigNumber: {
    fontSize: "56px",
    fontWeight: "800",
    color: "#146EB4",
    margin: 0,
  },
  scoreLabel: {
    fontSize: "16px",
    color: "#5f6368",
    fontWeight: "600",
    marginTop: "10px",
  },
  scoreRequirement: {
    fontSize: "13px",
    color: "#9aa0a6",
    marginTop: "12px",
  },
  reviewContainer: {
    textAlign: "left",
    marginTop: "30px",
    padding: "20px",
    background: "#f8f9fa",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
  },
  reviewTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "18px",
    color: "#1a237e",
  },
  reviewQuestion: {
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #e8e8e8",
    marginBottom: "14px",
    background: "#fff",
  },
  reviewQuestionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  reviewQuestionNumber: {
    fontWeight: "700",
    color: "#1a73e8",
  },
  reviewStatus: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  reviewQuestionText: {
    fontSize: "15px",
    marginBottom: "12px",
    color: "#202124",
  },
  reviewOptions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  reviewOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  reviewOptionLabel: {
    marginRight: "10px",
    fontSize: "16px",
  },
  correctBadge: {
    fontSize: "12px",
    fontWeight: "700",
    background: "rgba(76, 175, 80, 0.12)",
    color: "#2e7d32",
    padding: "4px 8px",
    borderRadius: "12px",
  },
  progressBarResult: {
    width: "100%",
    height: "12px",
    backgroundColor: "#e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    margin: "30px 0 40px 0",
  },
  progressFillResult: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.8s ease",
  },
  resultButtonGroup: {
    display: "flex",
    gap: "15px",
    flexDirection: "column",
  },
  retakeBtn: {
    padding: "14px 32px",
    backgroundColor: "#FF9900",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(255, 153, 0, 0.2)",
  },
  successBtn: {
    padding: "14px 32px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
  },
  secondaryBtn: {
    padding: "14px 32px",
    backgroundColor: "#146EB4",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(20, 110, 180, 0.2)",
  },
};

// Add animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);