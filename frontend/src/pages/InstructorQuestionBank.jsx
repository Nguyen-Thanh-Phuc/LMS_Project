import { useState, useEffect } from "react";
import api from "../services/api";

export default function InstructorQuestionBank() {
  const [bankQuizzes, setBankQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States Tạo Đề Mẫu
  const [isCreating, setIsCreating] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState([]);

  // State Ẩn/Hiện đáp án
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetchBank();
  }, []);

  const fetchBank = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quizzes/instructor/quiz-bank");
      setBankQuizzes(res.data.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleAddNewQuestion = () => {
    setNewQuestions([...newQuestions, { questionText: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const handleSaveBankQuiz = async () => {
    if (!quizTitle.trim() || newQuestions.length === 0) return alert("Please enter a quiz title and at least one question.");
    try {
      await api.post("/quizzes/with-questions", {
        title: quizTitle,
        isBankOnly: true,
        questionsData: newQuestions
      });
      alert("Quiz saved to bank successfully!");
      setIsCreating(false); setQuizTitle(""); setNewQuestions([]); fetchBank();
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  if (isCreating) {
    return (
      <div style={styles.container}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #dadce0" }}>
          <h2>Create Quiz Template</h2>
          <input style={{...styles.input, marginBottom: "20px"}} placeholder="Quiz Title (e.g., Midterm Practice)" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
          
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
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={handleAddNewQuestion} style={styles.secondaryBtn}>+ Add Question</button>
            <button onClick={handleSaveBankQuiz} style={styles.primaryBtn}>Save to Bank</button>
            <button onClick={() => setIsCreating(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>📚 Quiz Template Bank</h2>
        <div>
          <button 
            onClick={() => setShowAnswers(!showAnswers)} 
            style={{...styles.secondaryBtn, marginRight: "10px", backgroundColor: showAnswers ? "#e8f0fe" : "#f1f3f4", color: showAnswers ? "#1967d2" : "#3c4043"}}
          >
            {showAnswers ? "👁️ Show Answers" : "🙈 Hide Answers"}
          </button>
          <button onClick={() => setIsCreating(true)} style={styles.primaryBtn}>+ Create New Quiz</button>
        </div>
      </div>
      
      {loading ? <p>Loading data...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {bankQuizzes.map(quiz => (
            <details key={quiz._id} style={styles.accordion}>
              <summary style={styles.accordionSummary}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", paddingRight: "10px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1967d2" }}>📁 {quiz.title}</span>
                  <span style={{ fontSize: "13px", color: "#5f6368" }}>{quiz.questions?.length} questions</span>
                </div>
              </summary>
              
              <div style={styles.accordionContent}>
                {quiz.questions?.map((q, idx) => (
                  <div key={q._id} style={styles.questionCard}>
                    <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Question {idx + 1}: {q.questionText}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ 
                          padding: "8px", border: "1px solid #dadce0", borderRadius: "4px", fontSize: "14px",
                          backgroundColor: showAnswers && oIdx === q.correctAnswer ? "#e6f4ea" : "#fff",
                          borderColor: showAnswers && oIdx === q.correctAnswer ? "#188038" : "#dadce0",
                          fontWeight: showAnswers && oIdx === q.correctAnswer ? "bold" : "normal"
                        }}>
                          {opt} {showAnswers && oIdx === q.correctAnswer && "✓"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "30px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" },
  input: { width: "100%", padding: "10px", border: "1px solid #dadce0", borderRadius: "4px", boxSizing: "border-box" },
  primaryBtn: { padding: "10px 20px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  secondaryBtn: { padding: "10px 20px", background: "#f1f3f4", color: "#3c4043", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  questionBlock: { padding: "15px", border: "1px solid #dadce0", borderRadius: "8px", marginBottom: "15px", background: "#fafafa" },
  accordion: { background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", overflow: "hidden" },
  accordionSummary: { padding: "15px", background: "#f8f9fa", cursor: "pointer", display: "flex", outline: "none", listStyle: "none" },
  accordionContent: { padding: "15px", borderTop: "1px solid #dadce0", background: "#fff" },
  questionCard: { marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px dashed #dadce0" }
};