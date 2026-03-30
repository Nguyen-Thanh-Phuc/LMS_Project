import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import StudentLessonManager from "../components/StudentLessonManager";
import CoursePeople from "../components/CoursePeople";

export default function StudentCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("stream");
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  // States dành riêng cho tab Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Lấy chi tiết Khóa học
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.data);
      } catch (err) {
        console.error("Error fetching course detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetail();
  }, [id]);

  // Fetch enrollment + certificate status for this course
  useEffect(() => {
    const fetchEnrollmentAndCertificate = async () => {
      try {
        const res = await api.get("/enrollments/my");
        const enrolled = res.data.data.find((e) => e.courseId?._id === id);
        setEnrollment(enrolled || null);

        if (enrolled?.isCompleted) {
          setLoadingCertificate(true);
          try {
            const certRes = await api.get(`/certificates/my/course/${id}`);
            setCertificate(certRes.data.data);
          } catch (err) {
            console.error("Error fetching certificate:", err);
          } finally {
            setLoadingCertificate(false);
          }
        }
      } catch (err) {
        console.error("Error fetching enrollment info:", err);
      }
    };

    fetchEnrollmentAndCertificate();
  }, [id]);

  // Chỉ lấy danh sách Quiz khi sinh viên bấm sang Tab Quizzes
  useEffect(() => {
    if (activeTab === "quizzes") {
      const fetchQuizzes = async () => {
        setLoadingQuizzes(true);
        try {
          // Gọi API lấy quiz theo ID khóa học
          const res = await api.get(`/quizzes/course/${id}`);
          setQuizzes(res.data.data || []);
        } catch (err) {
          console.error("Error fetching quizzes", err);
        } finally {
          setLoadingQuizzes(false);
        }
      };
      fetchQuizzes();
    }
  }, [activeTab, id]);

  // If the URL includes a certificate download request, download it automatically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const downloadCertId = params.get("downloadCertificate");
    if (downloadCertId) {
      downloadById(downloadCertId);
    }
  }, [id]);

  const handleGenerateCertificate = async () => {
    if (!enrollment?.isCompleted) return;

    setGeneratingCertificate(true);
    try {
      await api.post("/certificates", { courseId: id });
      const certRes = await api.get(`/certificates/my/course/${id}`);
      setCertificate(certRes.data.data);
    } catch (err) {
      console.error("Error generating certificate:", err);
      alert(err.response?.data?.message || "Could not generate certificate.");
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const downloadById = async (certId) => {
    if (!certId) return;

    setDownloadingCertificate(true);
    try {
      const res = await api.get(`/certificates/${certId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate?.certificateId || "certificate"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      const serverMsg = err.response?.data?.message;
      const code = err.response?.status;
      const body = err.response?.data;

      alert(
        serverMsg
          ? `Download failed (${code}): ${serverMsg}`
          : `Failed to download certificate. ${code ? `Status: ${code}` : ""}`
      );

      if (body && typeof body === "object") {
        console.error("Download response body:", body);
      }
    } finally {
      setDownloadingCertificate(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate?._id) return;
    downloadById(certificate._id);
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading class data...</div>;
  if (!course) return <div style={{ padding: "40px", textAlign: "center" }}>Course not found!</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate("/my-courses")}
        style={{ marginBottom: "15px", padding: "8px 15px", cursor: "pointer", border: "none", borderRadius: "4px", background: "#f1f3f4", color: "#3c4043", fontWeight: "500" }}
      >
        ← Back to My Classes
      </button>

      {/* BANNER */}
      <div style={{ 
        height: "200px", 
        background: "linear-gradient(to right, #1967d2, #4285f4)", 
        borderRadius: "10px", 
        padding: "30px", 
        color: "white", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "flex-end",
        marginBottom: "20px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
      }}>
        <h1 style={{ margin: 0, fontSize: "36px" }}>{course.title}</h1>
        <p style={{ margin: "10px 0 0 0", fontSize: "16px", opacity: 0.9 }}>{course.description}</p>
      </div>

      {enrollment?.isCompleted && (
        <div style={{
          padding: "20px",
          background: "#e8f5e9",
          borderRadius: "10px",
          border: "1px solid #c8e6c9",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h3 style={{ margin: "0 0 6px 0", color: "#1b5e20" }}>🎓 Course Completed</h3>
            <p style={{ margin: 0, color: "#2e7d32" }}>
              You have completed all required quizzes. Download your certificate below.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {loadingCertificate ? (
              <span style={{ color: "#2e7d32" }}>Loading certificate...</span>
            ) : certificate ? (
              <button
                onClick={handleDownloadCertificate}
                disabled={downloadingCertificate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1b5e20",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity: downloadingCertificate ? 0.6 : 1,
                }}
              >
                {downloadingCertificate ? "Downloading..." : "Download Certificate"}
              </button>
            ) : (
              <button
                onClick={handleGenerateCertificate}
                disabled={generatingCertificate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1b5e20",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity: generatingCertificate ? 0.6 : 1,
                }}
              >
                {generatingCertificate ? "Generating..." : "Generate Certificate"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: "30px" }}>
        <button 
          onClick={() => setActiveTab("stream")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "stream" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "stream" ? "#1a73e8" : "#5f6368", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
        >
          Stream
        </button>
        <button 
          onClick={() => setActiveTab("people")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "people" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "people" ? "#1a73e8" : "#5f6368", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
        >
          Classmates
        </button>
        <button 
          onClick={() => setActiveTab("quizzes")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "quizzes" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "quizzes" ? "#1a73e8" : "#5f6368", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
        >
          Assignments
        </button>
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === "stream" && <StudentLessonManager course={course} />}
        {activeTab === "people" && <CoursePeople course={course} />}
        
        {/* TAB ASSIGNMENTS (QUIZZES) */}
        {activeTab === "quizzes" && (
          <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            <h3 style={{ color: "#3c4043", margin: "0 0 20px 0", fontSize: "20px" }}>📝 Class Assignments</h3>
            
            {loadingQuizzes ? (
              <p style={{ textAlign: "center", color: "#5f6368" }}>Loading assignments...</p>
            ) : quizzes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #dadce0" }}>
                <p style={{ color: "#5f6368", margin: 0 }}>No assignments are currently available for this class.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {quizzes.map((quiz) => (
                  <div key={quiz._id} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    background: "#fff", 
                    padding: "20px", 
                    borderRadius: "8px", 
                    border: "1px solid #dadce0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1967d2", fontSize: "18px" }}>{quiz.title}</h4>
                      <div style={{ display: "flex", gap: "15px", fontSize: "14px", color: "#5f6368" }}>
                        <span>Total points: <strong>100</strong></span>
                        <span>Passing score: <strong style={{color: "#188038"}}>{quiz.passingScore}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/quiz/${quiz._id}`)}
                      style={{ 
                        padding: "10px 20px", 
                        backgroundColor: "#1a73e8", 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: "4px", 
                        fontWeight: "600", 
                        cursor: "pointer",
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#1557b0"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#1a73e8"}
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}