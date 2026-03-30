import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, limit, search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search) params.search = search;
      
      const res = await api.get("/admin/students", { params });
      setStudents(res.data.data);
      setTotal(res.data.pagination.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch students");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleBanStudent = async (studentId, isBanned) => {
    try {
      const endpoint = isBanned ? `unban` : `ban`;
      const reason = !isBanned ? prompt("Reason for banning this student:") : null;
      
      if (!isBanned && !reason) return;

      const payload = reason ? { reason } : {};
      await api.post(`/admin/students/${studentId}/${endpoint}`, payload);
      
      alert(`Student ${isBanned ? 'unbanned' : 'banned'} successfully!`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${isBanned ? 'unban' : 'ban'} student`);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="admin-table">
      <h2>Students Management</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
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

      {error && <div className="error">{error}</div>}

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Enrollments</th>
              <th>Completed</th>
              <th>Certificates</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id} style={student.banned ? { backgroundColor: "#ffe0e0" } : {}}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td className="stat">{student.stats?.enrollments || 0}</td>
                <td className="stat">{student.stats?.completedCourses || 0}</td>
                <td className="stat">{student.stats?.certificates || 0}</td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backgroundColor: student.banned ? "#ff4444" : "#44ff44",
                    color: student.banned ? "#fff" : "#000"
                  }}>
                    {student.banned ? "🔒 BANNED" : "✓ ACTIVE"}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="btn-small btn-primary"
                    onClick={() => handleViewStudent(student)}
                    style={{ marginRight: "8px" }}
                  >
                    👁️ View
                  </button>
                  <button 
                    className="btn-small"
                    onClick={() => handleBanStudent(student._id, student.banned)}
                    style={{
                      backgroundColor: student.banned ? "#4CAF50" : "#ff4444",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    {student.banned ? "🔓 Unban" : "🔒 Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal for Student Details */}
      {showModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Student Details</h2>
              <button 
                style={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <span style={styles.label}>Name:</span>
                <span>{selectedStudent.name}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Email:</span>
                <span>{selectedStudent.email}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Status:</span>
                <span style={{
                  color: selectedStudent.banned ? "#ff4444" : "#4CAF50",
                  fontWeight: "600"
                }}>
                  {selectedStudent.banned ? "🔒 BANNED" : "✓ ACTIVE"}
                </span>
              </div>
              {selectedStudent.banned && selectedStudent.bannedReason && (
                <div style={styles.detailRow}>
                  <span style={styles.label}>Ban Reason:</span>
                  <span>{selectedStudent.bannedReason}</span>
                </div>
              )}
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={styles.statNumber}>{selectedStudent.stats?.enrollments || 0}</div>
                  <div style={styles.statLabel}>Enrollments</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNumber}>{selectedStudent.stats?.completedCourses || 0}</div>
                  <div style={styles.statLabel}>Completed</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statNumber}>{selectedStudent.stats?.certificates || 0}</div>
                  <div style={styles.statLabel}>Certificates</div>
                </div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Joined:</span>
                <span>{new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.btnClose}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto"
  },
  modalHeader: {
    padding: "24px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666"
  },
  modalContent: {
    padding: "24px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: "16px",
    borderBottom: "1px solid #f0f0f0"
  },
  label: {
    fontWeight: "600",
    color: "#333",
    minWidth: "120px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    margin: "20px 0",
    padding: "20px 0",
    borderTop: "1px solid #f0f0f0",
    borderBottom: "1px solid #f0f0f0"
  },
  statBox: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px"
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a73e8",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "600"
  },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px"
  },
  btnClose: {
    padding: "8px 16px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600"
  }
};
