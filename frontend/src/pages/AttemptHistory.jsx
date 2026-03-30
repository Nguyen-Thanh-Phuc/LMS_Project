import { useEffect, useState, useMemo } from "react";
import api from "../services/api";

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Filter & Sort
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" }); // Mặc định: Mới nhất lên đầu

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/attempts/my/history");
        setAttempts(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Lấy danh sách các Khóa học duy nhất để đưa vào Dropdown Filter
  const uniqueCourses = useMemo(() => {
    const courses = attempts.map(a => a.quizId?.courseId?.title).filter(Boolean);
    return ["All", ...new Set(courses)];
  }, [attempts]);

  // Logic Xử lý Lọc (Filter) và Sắp xếp (Sort)
  const processedAttempts = useMemo(() => {
    let result = [...attempts];

    // 1. Lọc theo Khóa học
    if (filterCourse !== "All") {
      result = result.filter(a => a.quizId?.courseId?.title === filterCourse);
    }

    // 2. Lọc theo Trạng thái (Passed/Failed)
    if (filterStatus !== "All") {
      const isPassed = filterStatus === "Passed";
      result = result.filter(a => a.passed === isPassed);
    }

    // 3. Sắp xếp
    result.sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortConfig.key === "score") {
        return sortConfig.direction === "asc" ? a.score - b.score : b.score - a.score;
      }
      if (sortConfig.key === "course") {
        const titleA = a.quizId?.courseId?.title || "";
        const titleB = b.quizId?.courseId?.title || "";
        return sortConfig.direction === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      }
      return 0;
    });

    return result;
  }, [attempts, filterCourse, filterStatus, sortConfig]);

  // Hàm xử lý khi click vào tiêu đề cột để thay đổi Sắp xếp
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Hàm render icon mũi tên Sắp xếp
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  if (loading) {
    return <div style={styles.loading}>⏳ Loading history...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📜 My Quiz History</h1>

      {attempts.length === 0 ? (
        <div style={styles.empty}>No quiz attempts yet.</div>
      ) : (
        <>
          {/* THANH CÔNG CỤ FILTER */}
          <div style={styles.filterContainer}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Course:</label>
              <select 
                value={filterCourse} 
                onChange={(e) => setFilterCourse(e.target.value)}
                style={styles.selectInput}
              >
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.selectInput}
              >
                <option value="All">All Statuses</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            
            <div style={styles.statsText}>
              Showing {processedAttempts.length} results
            </div>
          </div>

          {/* BẢNG DỮ LIỆU */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={{...styles.th, cursor: "pointer"}} onClick={() => handleSort("course")}>
                    Course <span style={styles.sortIcon}>{getSortIcon("course")}</span>
                  </th>
                  <th style={styles.th}>Quiz</th>
                  <th style={{...styles.thCenter, cursor: "pointer"}} onClick={() => handleSort("score")}>
                    Score <span style={styles.sortIcon}>{getSortIcon("score")}</span>
                  </th>
                  <th style={styles.thCenter}>Status</th>
                  <th style={{...styles.thCenter, cursor: "pointer"}} onClick={() => handleSort("date")}>
                    Date <span style={styles.sortIcon}>{getSortIcon("date")}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {processedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{...styles.tdCenter, padding: "30px", fontStyle: "italic", color: "#6b7280"}}>
                      No matches found for your filters.
                    </td>
                  </tr>
                ) : (
                  processedAttempts.map((attempt) => (
                    <tr key={attempt._id} style={styles.tr}>
                      <td style={styles.td}>
                        {attempt.quizId?.courseId?.title || "Unknown Course"}
                      </td>

                      <td style={styles.td}>
                        {attempt.quizId?.title || "Deleted Quiz"}
                      </td>

                      <td style={styles.tdCenter}>
                        <strong>{attempt.score}%</strong>
                      </td>

                      <td style={styles.tdCenter}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: attempt.passed ? "#dcfce7" : "#fee2e2",
                            color: attempt.passed ? "#166534" : "#991b1b",
                          }}
                        >
                          {attempt.passed ? "Passed" : "Failed"}
                        </span>
                      </td>

                      <td style={styles.tdCenter}>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "50px", backgroundColor: "#f9fafb", minHeight: "100vh" },
  title: { marginBottom: "20px", fontSize: "28px", fontWeight: "700", color: "#111827" },
  
  // Styles mới cho phần Lọc
  filterContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    padding: "15px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    alignItems: "center",
    flexWrap: "wrap"
  },
  filterGroup: { display: "flex", alignItems: "center", gap: "10px" },
  filterLabel: { fontSize: "14px", fontWeight: "600", color: "#374151" },
  selectInput: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    backgroundColor: "#f9fafb",
    minWidth: "150px"
  },
  statsText: { marginLeft: "auto", fontSize: "13px", color: "#6b7280", fontWeight: "500" },
  sortIcon: { fontSize: "12px", color: "#9ca3af", marginLeft: "4px" },

  // Giữ nguyên các Style cũ
  tableWrapper: { backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f3f4f6" },
  th: { textAlign: "left", padding: "16px", fontSize: "14px", fontWeight: "600", color: "#374151", transition: "background-color 0.2s" },
  thCenter: { textAlign: "center", padding: "16px", fontSize: "14px", fontWeight: "600", color: "#374151", transition: "background-color 0.2s" },
  tr: { borderTop: "1px solid #f1f5f9" },
  td: { padding: "16px", fontSize: "14px", color: "#374151" },
  tdCenter: { padding: "16px", fontSize: "14px", textAlign: "center", color: "#374151" },
  statusBadge: { padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-block" },
  empty: { padding: "40px", backgroundColor: "#ffffff", borderRadius: "12px", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.05)" },
  loading: { padding: "60px", textAlign: "center", fontSize: "16px" },
};