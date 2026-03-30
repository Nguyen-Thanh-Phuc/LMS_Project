import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Get course details
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.data);

        // Get my enrollments
        const enrollRes = await api.get("/enrollments/my-enrollments");

        const enrollments = enrollRes.data.data;

        const isEnrolled = enrollments.some(
          (e) => e.courseId?._id === id
        );

        setEnrolled(isEnrolled);
      } catch (error) {
        console.error("Error loading course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    try {
      await api.post("/enrollments", {
        courseId: id,
      });

      alert("Enrolled successfully!");
      setEnrolled(true);
    } catch (error) {
      console.error("Enroll failed:", error);
      alert(
        error.response?.data?.message ||
        "Already enrolled or error occurred"
      );
    }
  };

  if (loading)
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  if (!course)
    return <h2 style={{ textAlign: "center" }}>Course not found</h2>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>


      {enrolled ? (
        <button
          onClick={() => navigate("/my-courses")}
          style={buttonStyle}
        >
          Go To My Courses
        </button>
      ) : (
        <button onClick={handleEnroll} style={buttonStyle}>
          Enroll Now
        </button>
      )}
    </div>
  );
}

const buttonStyle = {
  marginTop: "20px",
  padding: "10px 20px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};