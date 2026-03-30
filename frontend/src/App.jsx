import { Routes, Route, Navigate } from "react-router-dom";

/* ================= PUBLIC PAGES ================= */
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* ================= STUDENT COMPONENTS ================= */
import StudentLayout from "./components/StudentLayout";

/* ================= STUDENT PAGES ================= */
import StudentDashboard from "./pages/StudentDashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import Quiz from "./pages/Quiz";
import StudentCourseDetail from "./pages/StudentCourseDetail";
import AvailableQuizzes from "./pages/AvailableQuizzes";
import CourseQuizzes from "./pages/CourseQuizzes";
import AttemptHistory from "./pages/AttemptHistory";
import Profile from "./pages/Profile";


/* ================= ADMIN COMPONENTS ================= */
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminLayout from "./components/AdminLayout";

/* ================= ADMIN PAGES ================= */
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourses from "./pages/AdminCourses";
import AdminStudents from "./pages/AdminStudents";
import AdminEnrollments from "./pages/AdminEnrollments";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminAttempts from "./pages/AdminAttempts";
import AdminCertificates from "./pages/AdminCertificates";
import AdminCourseDetail from "./pages/AdminCourseDetail";
import InstructorQuestionBank from "./pages/InstructorQuestionBank";

function App() {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* ================= STUDENT ROUTES ================= */}
      <Route element={<StudentLayout />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quizzes" element={<AvailableQuizzes />} />
        <Route path="/my-courses/:id" element={<StudentCourseDetail />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/courses/:id/quizzes" element={<CourseQuizzes />} />
        <Route path="/history" element={<AttemptHistory />} />
      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/:id" element={<AdminCourseDetail />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="attempts" element={<AdminAttempts />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="/admin/question-bank" element={<InstructorQuestionBank />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;