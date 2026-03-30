import { useState, useEffect } from "react";
import api from "../services/api";

export default function CourseQuizManager({ courseId, isPublished = false }) {
  const [quizzes, setQuizzes] = useState([]);
  const [bankQuizzes, setBankQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewState, setViewState] = useState("list"); // "list" | "create" | "import"

  // States Tạo Mới
  const [quizTitle, setQuizTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState([]);
  const [saveToBank, setSaveToBank] = useState(false); // Checkbox lưu Đề vào Bank

  // State lưu trữ tên mới khi import (Key là ID của quiz mẫu)
  const [importTitles, setImportTitles] = useState({});

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizRes, bankRes] = await Promise.all([
        api.get(`/quizzes/course/${courseId}`),
        api.get("/quizzes/instructor/quiz-bank")
      ]);
      setQuizzes(quizRes.data.data || []);
      setBankQuizzes(bankRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewQuestion = () => {
    setNewQuestions([...newQuestions, { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const handleCreateNewQuiz = async () => {
    if (!quizTitle.trim() || newQuestions.length === 0) return alert("Please provide a quiz title and at least one question.");
    try {
      await api.post("/quizzes/with-questions", {
        title: quizTitle, courseId, questionsData: newQuestions, saveToBank
      });
      alert("Quiz published successfully!");
      setViewState("list");
      setQuizTitle("");
      setNewQuestions([]);
      setSaveToBank(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const handleImportFromBank = async (bankQuizId, originalTitle) => {
    const customTitle = importTitles[bankQuizId] || originalTitle; 
    
    try {
      await api.post("/quizzes/import-from-bank", { 
        bankQuizId, 
        courseId, 
        newTitle: customTitle 
      });
      alert(`Imported quiz "${customTitle}" successfully!`);
      setViewState("list");
      fetchData();
    } catch (err) {
      alert("Failed to import quiz.");
    }
  };

  // =====================================
  // GIAO DIỆN: TẠO MỚI QUIZ
  // =====================================
  if (viewState === "create") {
    if (isPublished) {
      return (
        <div style={styles.card}>
          <p style={{ color: "#d32f2f", fontWeight: "bold" }}>
            The course is open for enrollment. You cannot add new quizzes to preserve students' progress tracking.
          </p>
          <button onClick={() => setViewState("list")} style={styles.primaryBtn}>Go Back</button>
        </div>
      );
    }

    return (
      <div style={styles.card}>
        <h3>Create New Quiz for Course</h3>
        <input style={{...styles.input, marginBottom: "20px"}} placeholder="Quiz title..." value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
        
        {newQuestions.map((q, qIndex) => (
          <div key={qIndex} style={styles.questionBlock}>
            <h5>Question {qIndex + 1}</h5>
            <input style={{...styles.input, marginBottom: "10px"}} placeholder="Question text..." value={q.questionText} onChange={(e) => { const updated = [...newQuestions]; updated[qIndex].questionText = e.target.value; setNewQuestions(updated); }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              {[0, 1, 2, 3].map(optIndex => (
                <input key={optIndex} style={styles.input} placeholder={`Option ${optIndex + 1}`} value={q.options[optIndex]} onChange={(e) => { const updated = [...newQuestions]; updated[qIndex].options[optIndex] = e.target.value; setNewQuestions(updated); }} />
              ))}
            </div>
            <select style={styles.input} value={q.correctAnswer} onChange={(e) => { const updated = [...newQuestions]; updated[qIndex].correctAnswer = Number(e.target.value); setNewQuestions(updated); }}>
              <option value={0}>Correct answer 1</option><option value={1}>Correct answer 2</option><option value={2}>Correct answer 3</option><option value={3}>Correct answer 4</option>
            </select>
          </div>
        ))}
        
        <div style={{ margin: "20px 0", padding: "15px", background: "#e8f0fe", borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "bold", color: "#1967d2" }}>
            <input type="checkbox" checked={saveToBank} onChange={(e) => setSaveToBank(e.target.checked)} style={{ width: "18px", height: "18px" }} />
            💾 Save a copy of this quiz in the Quiz Bank
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleAddNewQuestion} style={styles.secondaryBtn}>+ Add Question</button>
          <button onClick={handleCreateNewQuiz} style={styles.primaryBtn}>Publish Quiz</button>
          <button onClick={() => setViewState("list")} style={styles.secondaryBtn}>Cancel</button>
        </div>
      </div>
    );
  }

  // =====================================
  // GIAO DIỆN: IMPORT TỪ NGÂN HÀNG
  // =====================================
  if (viewState === "import") {
    if (isPublished) {
      return (
        <div style={styles.card}>
          <p style={{ color: "#d32f2f", fontWeight: "bold" }}>
            This course is open for enrollment; adding new quizzes is temporarily disabled to maintain student progress.
          </p>
          <button onClick={() => setViewState("list")} style={styles.primaryBtn}>Return</button>
        </div>
      );
    }

    return (
      <div style={styles.card}>
        <h3>Select a Quiz Template from the Bank</h3>
        {bankQuizzes.length === 0 ? <p>The quiz bank is empty.</p> : (
          <div style={{ display: "grid", gap: "15px" }}>
            {bankQuizzes.map(quiz => (
              <div key={quiz._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", border: "1px solid #dadce0", borderRadius: "8px", background: "#fafafa" }}>
                
                <div style={{ flex: 1, marginRight: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#5f6368" }}>Customize the quiz name (optional):</label>
                  <input 
                    style={{ ...styles.input, marginTop: "5px", padding: "8px", fontWeight: "bold", color: "#1967d2" }}
                    value={importTitles[quiz._id] !== undefined ? importTitles[quiz._id] : quiz.title}
                    onChange={(e) => setImportTitles({ ...importTitles, [quiz._id]: e.target.value })}
                  />
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#5f6368" }}>{quiz.questions?.length} questions included</p>
                </div>
                
                <button 
                  onClick={() => handleImportFromBank(quiz._id, quiz.title)} 
                  style={{...styles.primaryBtn, height: "fit-content"}}
                >
                  📥 Import This Quiz
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setViewState("list")} style={{...styles.secondaryBtn, marginTop: "20px"}}>Back</button>
      </div>
    );
  }

  // =====================================
  // GIAO DIỆN: DANH SÁCH MẶC ĐỊNH
  // =====================================
  return (
    <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
        {isPublished ? (
          <p style={{ color: "#d32f2f", fontWeight: "bold", margin: 0 }}>
            Course is open for enrollment, so adding new quizzes is temporarily disabled to keep progress consistent.
          </p>
        ) : (
          <>
            <button onClick={() => setViewState("import")} style={{...styles.primaryBtn, background: "#188038"}}>📥 Import from Quiz Bank</button>
            <button onClick={() => setViewState("create")} style={styles.primaryBtn}>+ Create New Quiz</button>
          </>
        )}
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: "grid", gap: "15px" }}>
          {quizzes.length === 0 ? <p>This course has no quizzes yet.</p> : null}
          {quizzes.map(quiz => (
            <div key={quiz._id} style={styles.card}>
              <h4 style={{ margin: "0 0 5px 0", color: "#1967d2" }}>{quiz.title}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#5f6368" }}>{quiz.questions?.length || 0} questions</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// BỘ TỪ ĐIỂN CSS
const styles = {
  card: { background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #dadce0" },
  input: { width: "100%", padding: "10px", border: "1px solid #dadce0", borderRadius: "4px", boxSizing: "border-box" },
  primaryBtn: { padding: "10px 20px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  secondaryBtn: { padding: "10px 20px", background: "#f1f3f4", color: "#3c4043", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  questionBlock: { padding: "15px", border: "1px solid #dadce0", borderRadius: "8px", marginBottom: "15px", background: "#fafafa" }
};