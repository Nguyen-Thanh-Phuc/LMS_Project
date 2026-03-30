import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminTables.css";

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, [page, limit, filterStatus]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/admin/certificates", { params });
      setCertificates(res.data.data);
      setTotal(res.data.pagination.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const handleDownload = async (cert) => {
    try {
      // request blob from backend
      const res = await api.get(`/certificates/${cert._id}/download`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${cert.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("download error", err);
      alert(
        err.response?.data?.message || "Failed to download certificate"
      );
    }
  };



  if (loading) return <div className="loading">Loading certificates...</div>;

  return (
    <div className="admin-table">
      <h2>Certificates Management</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="limit-select"
        >
          <option value="">All Certificates</option>
          <option value="issued">Issued</option>
          <option value="revoked">Revoked</option>
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

      {error && <div className="error">{error}</div>}

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Certificate ID</th>
              <th>Issued Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert._id}>
                <td>{cert.userId?.name || cert.studentName || "Unknown"}</td>
                <td>{cert.courseId?.title || cert.courseName || "Unknown"}</td>
                <td>{cert.certificateId}</td>
                <td>{new Date(cert.completionDate || cert.issuedAt || cert.createdAt).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`status ${
                      cert.status === "issued"
                        ? "status-passed"
                        : "status-failed"
                    }`}
                  >
                    {cert.status}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn-small btn-primary"
                    onClick={() => handleDownload(cert)}
                  >
                    Download
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
    </div>
  );
}
