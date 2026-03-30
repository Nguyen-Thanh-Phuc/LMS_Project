import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";
import LessonManager from "../components/LessonManager";
import { Link } from "react-router-dom";
export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States cho phân trang & Lọc
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");

  // === STATES CHO FORM THÊM/SỬA ===
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // Biến này để phân biệt đang Sửa hay Thêm mới
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [page, limit, search, sort]);

  // === 1. READ (ĐỌC DANH SÁCH) ===
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = { page, limit, sort };
      if (search.trim() !== "") params.search = search.trim();

      // Giữ nguyên API lấy danh sách của đồng đội bạn
      const res = await api.get("/admin/courses", { params }); 
      
      if (res.data && res.data.data) {
        setCourses(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      } else {
        setCourses([]);
        setTotal(0);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // === 2. CREATE & UPDATE (THÊM / SỬA) ===
  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      if (thumbnailFile) {
        data.append("thumbnail", thumbnailFile);
      }

      if (editingId) {
        // If editingId exists -> call update API
        await api.put(`/courses/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Course updated successfully!");
      } else {
        // If not -> call create API
        await api.post("/courses", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Course created successfully!");
      }

      // Reset form and close
      resetForm();
      fetchCourses();

    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Thao tác thất bại"));
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // === BẮT SỰ KIỆN BẤM NÚT EDIT ===
  const handleEditClick = (course) => {
    setEditingId(course._id); // Ghi nhớ ID đang sửa
    setFormData({
      title: course.title,
      description: course.description,
    });
    setThumbnailFile(null); // Clear file cũ trên input
    setShowForm(true); // Mở form lên
    window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn nhẹ lên đầu trang
  };

  // === 3. DELETE (XÓA) ===
  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this course?")) {
      return;
    }

    try {
      await api.delete(`/courses/${id}`);
      alert("Course deleted successfully!");
      fetchCourses();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Unable to delete"));
      console.error(err);
    }
  };

  // Hàm dọn dẹp Form
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", description: "" });
    setThumbnailFile(null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-table">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Courses Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: showForm ? '#dc3545' : '#007bff' }}
        >
          {showForm ? "Cancel / Close" : "+ Add New Course"}
        </button>
      </div>

      {/* === KHU VỰC FORM THÊM/SỬA === */}
      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h3>{editingId ? "Update Course" : "Create New Course"}</h3>
          <form onSubmit={handleSubmitCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            
            <input 
              type="text" 
              placeholder="Course Title" 
              required 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
            
            <textarea 
              placeholder="Description" 
              required 
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', resize: 'vertical' }}
            />

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                {editingId ? "Update Thumbnail (Bỏ trống nếu giữ ảnh cũ):" : "Course Thumbnail:"}
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setThumbnailFile(e.target.files[0])} 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitLoading} 
              style={{ padding: '12px', background: submitLoading ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: submitLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              {submitLoading ? "Processing..." : (editingId ? "Save Changes" : "Submit Course")}
            </button>
          </form>
        </div>
      )}

      {/* Filters (Giữ nguyên) */}
      <div className="filters">
        <input type="text" placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="title">Title (A-Z)</option>
        </select>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="limit-select">
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {error && <div className="error" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {/* Table */}
      {loading && courses.length === 0 ? (
        <div className="loading">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          No courses available to display.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Status</th>
                <th>Instructor</th>
                <th>Students</th>
                <th>Lessons</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id}>
                  <td>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', background: '#e9ecef', borderRadius: '4px' }}></div>
                    )}
                  </td>
                  <td>
  <Link 
    to={`/admin/courses/${course._id}`} 
    style={{ color: "#1a73e8", fontWeight: "bold", textDecoration: "none" }}
    onMouseOver={(e) => e.target.style.textDecoration = "underline"}
    onMouseOut={(e) => e.target.style.textDecoration = "none"}
  >
    {course.title}
  </Link>
</td>
                  <td>
                    <span className={`status ${course.isPublished ? 'status-published' : 'status-draft'}`}>
                      <span style={{ marginRight: '6px' }}>{course.isPublished ? '🟢' : '🔴'}</span>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{course.instructor?.name || course.instructor || "N/A"}</td>
                  <td className="stat">{course.stats?.enrollments || course.studentsEnrolled?.length || 0}</td>
                  <td className="stat">{course.stats?.lessons || 0}</td>
                  <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                  <td className="actions" style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn-small btn-primary" onClick={() => handleEditClick(course)}>Edit</button>
                    <button className="btn-small btn-danger" onClick={() => handleDeleteClick(course._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-small">← Previous</button>
          <span className="page-info">Page {page} of {totalPages} (Total: {total})</span>
          <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} className="btn-small">Next →</button>
        </div>
      )}
    </div>
  );
}