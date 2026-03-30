import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterCourse, setFilterCourse] = useState("");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, [page, limit, filterCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses", { params: { limit: 100 } });
      setCourses(res.data.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching enrollments with page:", page, "limit:", limit);
      
      const params = { page, limit };
      if (filterCourse) params.courseId = filterCourse;
      
      const res = await api.get("/admin/enrollments", { params });
      console.log("Enrollments response:", res.data);
      
      setEnrollments(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching enrollments:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch enrollments");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="admin-table">
        <h2>Enrollments Management</h2>
        <div className="loading" style={{ padding: "40px", textAlign: "center" }}>
          ⏳ Loading enrollments...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table">
      <h2>Enrollments Management</h2>

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

      {error && (
        <div className="error" style={{ padding: "15px", color: "#d93025", backgroundColor: "#fce8e6", borderRadius: "4px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {enrollments.length === 0 && !error && (
        <div style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "16px" }}>
          📭 No enrollments found
        </div>
      )}

      {/* Table */}
      {enrollments.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Enrolled Date</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                  // progress may be a number or an object like { completedLessons, passedQuizzes, percentage }
                  const rawProgress = enrollment.progress;
                  const progressValue = typeof rawProgress === "number"
                    ? rawProgress
                    : (rawProgress && (rawProgress.percentage ?? rawProgress.percent)) || 0;

                  // defensive formatting for nested user/course fields
                  const studentName = enrollment.userId?.name || (typeof enrollment.userId === 'string' ? enrollment.userId : 'Unknown');
                  const courseTitle = enrollment.courseId?.title || (typeof enrollment.courseId === 'string' ? enrollment.courseId : 'Unknown');

                  return (
                  <tr key={enrollment._id}>
                    <td>{studentName}</td>
                    <td>{courseTitle}</td>
                    <td>
                      {enrollment.enrolledAt
                        ? new Date(enrollment.enrolledAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progressValue}%`,
                          }}
                        >
                          {progressValue}%
                        </div>
                      </div>
                    </td>
                    <td>{progressValue === 100 ? "Completed" : (enrollment.status || "Active")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {enrollments.length > 0 && (
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
      )}
    </div>
  );
}
