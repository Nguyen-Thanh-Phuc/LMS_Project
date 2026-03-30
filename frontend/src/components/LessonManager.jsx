import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function LessonManager({ course }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Form Thêm/Sửa
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", videoUrl: "" });
  const [pdfFile, setPdfFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // States cho UI Tương tác
  const [activeVideoId, setActiveVideoId] = useState(null); // ID Youtube để mở Popup Video
  const [activePdfUrl, setActivePdfUrl] = useState(null);   // Link PDF để mở Popup PDF
  const [menuOpenId, setMenuOpenId] = useState(null);       // ID của bài học đang mở menu 3 chấm

  useEffect(() => {
    if (course?._id) fetchLessons();
  }, [course]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lessons/course/${course._id}`);
      // Đảo ngược danh sách để bài mới nhất lên đầu (như feed Facebook/Classroom)
      setLessons(res.data.data.reverse());
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const data = new FormData();
      data.append("courseId", course._id);
      data.append("title", formData.title);
      data.append("content", formData.content);
      if (formData.videoUrl) data.append("videoUrl", formData.videoUrl);
      if (pdfFile) data.append("pdfUrl", pdfFile);

      if (editingId) {
        // UPDATE BÀI HỌC
        await api.put(`/lessons/${editingId}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        // TẠO MỚI
        await api.post("/lessons", data, { headers: { "Content-Type": "multipart/form-data" } });
      }

      resetForm();
      fetchLessons();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Operation failed"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (lesson) => {
    setEditingId(lesson._id);
    setFormData({ title: lesson.title, content: lesson.content, videoUrl: lesson.videoUrl || "" });
    setPdfFile(null);
    setShowForm(true);
    setMenuOpenId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await api.delete(`/lessons/${id}`);
      fetchLessons();
    } catch (err) {
      alert("Error deleting lesson");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", content: "", videoUrl: "" });
    setPdfFile(null);
  };

  // Hàm lấy ID Youtube
  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Hàm Format thời gian & Kiểm tra "Đã chỉnh sửa"
  const formatTime = (createdAt, updatedAt) => {
    const createdDate = new Date(createdAt);
    const updatedDate = new Date(updatedAt);
    
    // Nếu thời gian update lệch thời gian create > 1000ms (1 giây) thì coi như là đã sửa
    const isEdited = updatedDate.getTime() - createdDate.getTime() > 1000;
    
    const timeString = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = createdDate.toLocaleDateString();

    return { 
      display: `${dateString} - ${timeString}`, 
      isEdited 
    };
  };

  // Lấy chữ cái đầu của Tên Giảng viên để làm Avatar
  const instructorName = course?.instructor?.name || "Admin";
  const avatarLetter = instructorName.charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Post announcement card > opens form */}
      <div 
        onClick={() => !showForm && setShowForm(true)}
        style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "15px 20px", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", marginBottom: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)" }}
      >
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#4285f4", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
          {avatarLetter}
        </div>
        <div style={{ color: "#3c4043", fontSize: "14px" }}>Share a lesson update with your students...</div>
      </div>

      {/* Lesson add/edit form */}
      {showForm && (
        <form onSubmit={handleSubmitLesson} style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "20px", marginBottom: "30px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)" }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Lesson" : "Create New Lesson"}</h3>
          <input type="text" placeholder="Lesson title..." required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <textarea placeholder="Lesson details..." required rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", resize: "vertical" }} />
          <input type="text" placeholder="YouTube video link (optional)..." value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Attach PDF/Doc file:</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPdfFile(e.target.files[0])} />
            {editingId && <small style={{ color: "gray", display: "block" }}>*Leave empty to keep existing file</small>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={resetForm} style={{ padding: "8px 16px", background: "none", border: "none", color: "#5f6368", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitLoading} style={{ padding: "8px 24px", background: "#1a73e8", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: submitLoading ? "wait" : "pointer" }}>
              {submitLoading ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      )}

      {/* Lesson feed */}
      {loading ? <p>Loading lessons...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {lessons.map((lesson) => {
            const ytId = getYouTubeID(lesson.videoUrl);
            const timeData = formatTime(lesson.createdAt, lesson.updatedAt);

            return (
              <div key={lesson._id} style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)" }}>
                
                {/* Header: Avatar, Name, Time & 3-Dot Menu */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", position: "relative" }}>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
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

                  {/* 3-Dot Menu */}
                  <div>
                    <button 
                      onClick={() => setMenuOpenId(menuOpenId === lesson._id ? null : lesson._id)}
                      style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#5f6368", padding: "5px" }}
                    >
                      ⋮
                    </button>
                    {menuOpenId === lesson._id && (
                      <div style={{ position: "absolute", right: 0, top: "35px", background: "#fff", border: "1px solid #ddd", borderRadius: "4px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", zIndex: 10 }}>
                        <button onClick={() => handleEditClick(lesson)} style={{ display: "block", width: "100%", padding: "10px 20px", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(lesson._id)} style={{ display: "block", width: "100%", padding: "10px 20px", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "red" }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#1967d2" }}>{lesson.title}</h3>
                <p style={{ whiteSpace: "pre-wrap", color: "#3c4043", fontSize: "14px", marginBottom: "15px" }}>{lesson.content}</p>

                {/* Attachments (Nằm ngang như Classroom) */}
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  
                  {/* Ô PDF */}
                  {lesson.pdfUrl && (
                    <div 
                      onClick={() => setActivePdfUrl(lesson.pdfUrl)}
                      style={{ width: "300px", border: "1px solid #dadce0", borderRadius: "8px", display: "flex", alignItems: "center", cursor: "pointer", overflow: "hidden" }}
                    >
                      <div style={{ width: "80px", height: "80px", background: "#f1f3f4", display: "flex", justifyContent: "center", alignItems: "center", borderRight: "1px solid #dadce0" }}>
                        <span style={{ fontSize: "30px", color: "#d93025" }}>📄</span>
                      </div>
                      <div style={{ padding: "10px", flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Attached Document.pdf</div>
                        <div style={{ fontSize: "12px", color: "#5f6368" }}>PDF Document</div>
                      </div>
                    </div>
                  )}

                  {/* Ô YOUTUBE */}
                  {ytId && (
                    <div 
                      onClick={() => setActiveVideoId(ytId)}
                      style={{ width: "300px", border: "1px solid #dadce0", borderRadius: "8px", display: "flex", alignItems: "center", cursor: "pointer", overflow: "hidden" }}
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${ytId}/default.jpg`} 
                        alt="Youtube" 
                        style={{ width: "100px", height: "80px", objectFit: "cover", borderRight: "1px solid #dadce0" }} 
                      />
                      <div style={{ padding: "10px", flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Video Bài Giảng</div>
                        <div style={{ fontSize: "12px", color: "#5f6368" }}>Video YouTube</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= MODALS TỐI MÀU (POPUP) ================== */}
      {/* ========================================================= */}

   {/* 1. PDF modal */}
     {/* 1. PDF modal */}
      {activePdfUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "90%", height: "90%", position: "relative", background: "#fff", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "10px 20px", background: "#333", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>PDF Viewer</span>
              <button onClick={() => setActivePdfUrl(null)} style={{ background: "none", color: "white", fontSize: "24px", border: "none", cursor: "pointer" }}>×</button>
            </div>
            
            {/* Browser default PDF viewer */}
            <object data={activePdfUrl} type="application/pdf" width="100%" height="100%">
              <iframe src={activePdfUrl} width="100%" height="100%" style={{ border: "none" }}>
                <p>Your browser doesn’t support inline PDF viewing. <a href={activePdfUrl} target="_blank" rel="noopener noreferrer">Click here to download</a>.</p>
              </iframe>
            </object>

          </div>
        </div>
      )}

      {/* 2. Modal Xem YouTube */}
      {activeVideoId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "80%", maxWidth: "900px", position: "relative" }}>
            <button onClick={() => setActiveVideoId(null)} style={{ position: "absolute", top: "-40px", right: "0", background: "none", color: "white", fontSize: "30px", border: "none", cursor: "pointer" }}>×</button>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}