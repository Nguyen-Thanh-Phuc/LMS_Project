import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import LessonManager from "../components/LessonManager"; 
import CoursePeople from "../components/CoursePeople";
import CourseQuizManager from "../components/CourseQuizManager"; 

export default function AdminCourseDetail() {
  const { id } = useParams(); // Get course ID from URL
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("stream"); // stream, people, quizzes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.data);
    } catch (err) {
      console.error("Error fetching course details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    const targetState = !course.isPublished;

    try {
      const res = await api.put(`/courses/${id}`, { isPublished: targetState });
      setCourse(res.data.data);
      alert(targetState ? "Course is now open for enrollment." : "Course is now closed.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to change course status.");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading course data...</div>;
  if (!course) return <div style={{ padding: "20px" }}>Course not found!</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate("/admin/courses")}
        style={{ marginBottom: "15px", padding: "8px 15px", cursor: "pointer", border: "none", borderRadius: "4px", background: "#f1f3f4" }}
      >
        ← Back to Course List
      </button>

      {/* COURSE BANNER */}
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

      {/* PUBLISH STATUS PANEL */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: course.isPublished ? "#e6f4ea" : "#fff8e1",
        border: `1px solid ${course.isPublished ? "#ceead6" : "#ffecb3"}`,
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "25px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Left Info Section */}
        <div>
          <div style={{ fontSize: "12px", color: "#5f6368", marginBottom: "4px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Course Visibility Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: course.isPublished ? "#1e8e3e" : "#f9a825",
              boxShadow: course.isPublished ? "0 0 0 3px #ceead6" : "0 0 0 3px #ffecb3"
            }}></span>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: course.isPublished ? "#1e8e3e" : "#f57f17" }}>
              {course.isPublished ? "Published (Available for Enrollment)" : "Draft Mode (Private & Closed)"}
            </span>
          </div>
        </div>

        {/* Right Action Button */}
        <button
          onClick={handleTogglePublish}
          style={{
            padding: "10px 20px",
            backgroundColor: course.isPublished ? "#fff" : "#1a73e8",
            color: course.isPublished ? "#d93025" : "#fff",
            border: course.isPublished ? "1px solid #d93025" : "none",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: course.isPublished ? "none" : "0 2px 4px rgba(26, 115, 232, 0.3)"
          }}
          onMouseOver={(e) => {
            if (course.isPublished) e.currentTarget.style.backgroundColor = "#fce8e6";
            else e.currentTarget.style.backgroundColor = "#1557b0";
          }}
          onMouseOut={(e) => {
            if (course.isPublished) e.currentTarget.style.backgroundColor = "#fff";
            else e.currentTarget.style.backgroundColor = "#1a73e8";
          }}
        >
          {course.isPublished ? "🔒 Unpublish Course" : "🚀 Open to Enroll"}
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: "20px" }}>
        <button 
          onClick={() => setActiveTab("stream")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "stream" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "stream" ? "#1a73e8" : "#5f6368", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
        >
          Stream
        </button>
        <button 
          onClick={() => setActiveTab("people")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "people" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "people" ? "#1a73e8" : "#5f6368", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
        >
          People
        </button>
        <button 
          onClick={() => setActiveTab("quizzes")}
          style={{ padding: "15px 25px", background: "none", border: "none", borderBottom: activeTab === "quizzes" ? "3px solid #1a73e8" : "3px solid transparent", color: activeTab === "quizzes" ? "#1a73e8" : "#5f6368", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
        >
          Quizzes
        </button>
      </div>

      {/* TAB CONTENT */}
      <div>
        {/* Stream Tab */}
        {activeTab === "stream" && (
          <LessonManager course={course} />
        )}

        {/* People Tab */}
        {activeTab === "people" && (
          <CoursePeople course={course} />
        )}

        {/* Quizzes Tab */}
        {activeTab === "quizzes" && (
          <CourseQuizManager courseId={course._id} isPublished={course.isPublished} />
        )}
      </div>
    </div>
  );
}