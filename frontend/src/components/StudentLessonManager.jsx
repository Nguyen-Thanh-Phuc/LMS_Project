import { useState, useEffect } from "react";
import api from "../services/api";

export default function StudentLessonManager({ course }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mảng chứa ID các bài học đã hoàn thành
  const [completedLessons, setCompletedLessons] = useState([]);

  // States for Modals
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activePdfUrl, setActivePdfUrl] = useState(null);

  useEffect(() => {
    if (course?._id) {
      fetchLessons();
      fetchMyEnrollment(); // Gọi thêm hàm lấy tiến độ
    }
  }, [course]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lessons/course/${course._id}`);
      setLessons(res.data.data.reverse()); // Newest first
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy thông tin ghi danh để biết bài nào đã đánh dấu hoàn thành
  const fetchMyEnrollment = async () => {
    try {
      const res = await api.get('/enrollments/my');
      const enrollments = res.data.data;
      // Tìm đúng bản ghi danh của khóa học này
      const currentEnrollment = enrollments.find(e => 
        (e.courseId._id || e.courseId) === course._id
      );
      if (currentEnrollment && currentEnrollment.progress) {
        setCompletedLessons(currentEnrollment.progress.completedLessons || []);
      }
    } catch (err) {
      console.error("Error fetching enrollment progress:", err);
    }
  };

  // Hàm gọi API Tắt/Bật đánh dấu hoàn thành
  const handleToggleComplete = async (lessonId) => {
    try {
      const res = await api.put(`/enrollments/course/${course._id}/lesson/${lessonId}/complete`);
      if (res.data.success) {
        // Cập nhật lại mảng hiển thị màu UI ngay lập tức
        setCompletedLessons(res.data.data.progress.completedLessons);
      }
    } catch (err) {
      console.error("Error toggling completion:", err);
      alert("Unable to update progress. Please try again.");
    }
  };

  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const formatTime = (createdAt, updatedAt) => {
    const createdDate = new Date(createdAt);
    const updatedDate = new Date(updatedAt);
    const isEdited = updatedDate.getTime() - createdDate.getTime() > 1000;
    
    return { 
      display: `${createdDate.toLocaleDateString()} - ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 
      isEdited 
    };
  };

  const instructorName = course?.instructor?.name || "Instructor";
  const avatarLetter = instructorName.charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      
      {loading ? <p>Loading class stream...</p> : lessons.length === 0 ? (
        <p style={{ textAlign: "center", color: "#5f6368", marginTop: "40px" }}>No materials have been posted yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {lessons.map((lesson) => {
            const ytId = getYouTubeID(lesson.videoUrl);
            const timeData = formatTime(lesson.createdAt, lesson.updatedAt);
            
            // Kiểm tra xem bài học này đã hoàn thành chưa
            const isCompleted = completedLessons.includes(lesson._id);

            return (
              <div key={lesson._id} style={{ 
                background: "#fff", 
                border: isCompleted ? "2px solid #188038" : "1px solid #dadce0", // Đổi màu viền nếu đã hoàn thành
                borderRadius: "8px", 
                padding: "20px", 
                boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)",
                transition: "border 0.2s ease" // Hiệu ứng chuyển màu mượt mà
              }}>
                
                {/* Header (No 3-dot menu) */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#4285f4", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
                    {avatarLetter}
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#3c4043", fontSize: "14px" }}>{instructorName}</div>
                    <div style={{ fontSize: "12px", color: "#5f6368", display: "flex", gap: "5px" }}>
                      <span>{timeData.display}</span>
                      {timeData.isEdited && <span>(edited)</span>}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#1967d2" }}>{lesson.title}</h3>
                <p style={{ whiteSpace: "pre-wrap", color: "#3c4043", fontSize: "14px", marginBottom: "15px" }}>{lesson.content}</p>

                {/* Attachments */}
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  {lesson.pdfUrl && (
                    <div onClick={() => setActivePdfUrl(lesson.pdfUrl)} style={{ width: "300px", border: "1px solid #dadce0", borderRadius: "8px", display: "flex", alignItems: "center", cursor: "pointer", overflow: "hidden" }}>
                      <div style={{ width: "80px", height: "80px", background: "#f1f3f4", display: "flex", justifyContent: "center", alignItems: "center", borderRight: "1px solid #dadce0" }}>
                        <span style={{ fontSize: "30px", color: "#d93025" }}>📄</span>
                      </div>
                      <div style={{ padding: "10px", flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Attached Document.pdf</div>
                        <div style={{ fontSize: "12px", color: "#5f6368" }}>PDF Document</div>
                      </div>
                    </div>
                  )}

                  {ytId && (
                    <div onClick={() => setActiveVideoId(ytId)} style={{ width: "300px", border: "1px solid #dadce0", borderRadius: "8px", display: "flex", alignItems: "center", cursor: "pointer", overflow: "hidden" }}>
                      <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt="Youtube" style={{ width: "100px", height: "80px", objectFit: "cover", borderRight: "1px solid #dadce0" }} />
                      <div style={{ padding: "10px", flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Video Lecture</div>
                        <div style={{ fontSize: "12px", color: "#5f6368" }}>YouTube Video</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NÚT ĐÁNH DẤU HOÀN THÀNH */}
                <div style={{ borderTop: "1px solid #dadce0", marginTop: "20px", paddingTop: "15px", display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => handleToggleComplete(lesson._id)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "6px",
                      border: isCompleted ? "1px solid #188038" : "1px solid #dadce0",
                      backgroundColor: isCompleted ? "#e6f4ea" : "#fff",
                      color: isCompleted ? "#188038" : "#3c4043",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isCompleted ? "✅ Completed" : "Mark as Complete"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PDF Modal */}
      {activePdfUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "90%", height: "90%", position: "relative", background: "#fff", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "10px 20px", background: "#333", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>PDF Viewer</span>
              <button onClick={() => setActivePdfUrl(null)} style={{ background: "none", color: "white", fontSize: "24px", border: "none", cursor: "pointer" }}>×</button>
            </div>
            <object data={activePdfUrl} type="application/pdf" width="100%" height="100%">
              <iframe src={activePdfUrl} width="100%" height="100%" style={{ border: "none" }} title="PDF">
                <p>Your browser doesn't support PDF viewing. <a href={activePdfUrl}>Click here to download</a>.</p>
              </iframe>
            </object>
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      {activeVideoId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "80%", maxWidth: "900px", position: "relative" }}>
            <button onClick={() => setActiveVideoId(null)} style={{ position: "absolute", top: "-40px", right: "0", background: "none", color: "white", fontSize: "30px", border: "none", cursor: "pointer" }}>×</button>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`} frameBorder="0" allowFullScreen title="Video"></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}