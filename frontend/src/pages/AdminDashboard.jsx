import { useState, useEffect } from "react";
import api from "../services/api";
import "../components/AdminDashboard.css";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes] = await Promise.all([
        api.get("/admin/dashboard/overview"),
        api.get("/admin/dashboard/analytics"),
      ]);

      setOverview(overviewRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <h2>Dashboard Overview</h2>

      {/* Statistics Grid */}
      <div className="stats-grid">
        {/* Users Stats */}
        <div className="stat-card">
          <div className="stat-icon users-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{overview?.users.total}</p>
            <p className="stat-detail">
              {overview?.users.students} students, {overview?.users.admins} admin
            </p>
          </div>
        </div>

        {/* Courses Stats */}
        <div className="stat-card">
          <div className="stat-icon courses-icon">📚</div>
          <div className="stat-content">
            <p className="stat-label">Total Courses</p>
            <p className="stat-value">{overview?.content.courses}</p>
            <p className="stat-detail">{overview?.content.lessons} lessons</p>
          </div>
        </div>

        {/* Enrollments Stats */}
        <div className="stat-card">
          <div className="stat-icon enrollments-icon">📝</div>
          <div className="stat-content">
            <p className="stat-label">Enrollments</p>
            <p className="stat-value">{overview?.enrollments.total}</p>
            <p className="stat-detail">
              {overview?.enrollments.completionRate}% completion
            </p>
          </div>
        </div>

        {/* Quizzes Stats */}
        <div className="stat-card">
          <div className="stat-icon quizzes-icon">❓</div>
          <div className="stat-content">
            <p className="stat-label">Quiz Stats</p>
            <p className="stat-value">{overview?.quizzes.totalAttempts}</p>
            <p className="stat-detail">
              {overview?.quizzes.passRate}% pass rate
            </p>
          </div>
        </div>

        {/* Certificates Stats */}
        <div className="stat-card">
          <div className="stat-icon certificates-icon">🏆</div>
          <div className="stat-content">
            <p className="stat-label">Certificates</p>
            <p className="stat-value">{overview?.certificates.issued}</p>
            <p className="stat-detail">
              {overview?.certificates.revoked} revoked
            </p>
          </div>
        </div>

        {/* Quizzes Content */}
        <div className="stat-card">
          <div className="stat-icon content-icon">📖</div>
          <div className="stat-content">
            <p className="stat-label">Quiz Content</p>
            <p className="stat-value">{overview?.content.quizzes}</p>
            <p className="stat-detail">Active quizzes</p>
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
      {analytics?.recentEnrollments && (
        <div className="section">
          <h3>Recent Enrollments</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Enrolled At</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentEnrollments.map((enrollment) => (
                  <tr key={enrollment._id}>
                    <td>{enrollment.userId?.name}</td>
                    <td>{enrollment.courseId?.title}</td>
                    <td>
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${enrollment.progress?.percentage || 0}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Best Performing Courses */}
      {analytics?.popularCourses && (
        <div className="section">
          <h3>Most Popular Courses</h3>
          <div className="courses-grid">
            {analytics.popularCourses.map((item) => (
              <div key={item._id} className="course-card">
                <h4>{item.course?.[0]?.title || "Unknown"}</h4>
                <p className="course-stat">
                  <strong>{item.enrollmentCount}</strong> enrollments
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
