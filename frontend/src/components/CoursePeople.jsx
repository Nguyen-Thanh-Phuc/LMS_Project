import { useState, useEffect } from "react";
import api from "../services/api";

export default function CoursePeople({ course }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin user hiện tại để kiểm tra role và xác định "(you)"
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (course?._id) {
      fetchStudents();
    }
  }, [course]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // ADMIN FLOW: Call API to get full list
        const res = await api.get(`/admin/enrollments?courseId=${course._id}&page=1&limit=50`);
        if (res.data && res.data.data) {
          const enrolledUsers = res.data.data
            .map(enrollment => enrollment.userId)
            .filter(Boolean);
          setStudents(enrolledUsers);
        }
      } else {
        // STUDENT FLOW: Use embedded data from course object
        const enrolledUsers = course.studentsEnrolled || [];
        
        const formattedStudents = enrolledUsers.map(student => {
          if (typeof student === 'string' || !student.name) {
            return { _id: student._id || student, name: "Unknown Student" };
          }
          return student;
        });

        setStudents(formattedStudents);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return "#1967d2";
    const colors = ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6d01", "#46bdc6", "#8e24aa"];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const instructorName = course?.instructor?.name || "Unknown Instructor";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      
      {/* TEACHER SECTION */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#1967d2", fontSize: "32px", fontWeight: "400", margin: "0 0 15px 0" }}>Teacher</h2>
        <div style={{ height: "1px", background: "#1967d2", marginBottom: "15px" }}></div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "10px 0" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: getAvatarColor(instructorName), color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
            {instructorName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "16px", color: "#3c4043", fontWeight: "500" }}>{instructorName}</span>
        </div>
      </div>

      {/* CLASSMATES SECTION */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "15px" }}>
          <h2 style={{ color: "#1967d2", fontSize: "32px", fontWeight: "400", margin: "0" }}>Classmates</h2>
          <span style={{ color: "#5f6368", fontSize: "14px", fontWeight: "500" }}>{students.length} students</span>
        </div>
        <div style={{ height: "1px", background: "#1967d2", marginBottom: "10px" }}></div>

        {loading ? (
          <p style={{ color: "#5f6368" }}>Loading classmates...</p>
        ) : students.length === 0 ? (
          <p style={{ color: "#5f6368", fontStyle: "italic" }}>No students have enrolled in this class yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {students.map((student, index) => {
              // Kiểm tra xem user đang render có phải là user đang đăng nhập không
              const isMe = student._id === currentUser._id;
              const studentName = student.name || "Unknown Student";

              return (
                <div key={student._id || index} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px 0", borderBottom: "1px solid #e0e0e0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: getAvatarColor(studentName), color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "bold" }}>
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "15px", color: "#3c4043", fontWeight: "500" }}>
                    {studentName}
                    
                    {/* THÊM CHỮ (YOU) NẾU LÀ CHÍNH MÌNH */}
                    {isMe && (
                      <span style={{ color: "#80868b", fontWeight: "400", marginLeft: "6px", fontSize: "14px" }}>
                        (you)
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}