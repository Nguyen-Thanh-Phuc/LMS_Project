import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Danh sách các menu được cấu hình sẵn màu sắc và đường dẫn
  const menuItems = [
    {
      title: "📚 Browse Courses",
      description: "Explore all available courses and start learning.",
      buttonText: "Browse Now",
      path: "/courses",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: "🎓"
    },
    {
      title: "👤 My Profile",
      description: "View your learning history, certificates, and progress.",
      buttonText: "View Profile",
      path: "/profile",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      icon: "🧑‍🎓"
    },
    {
      title: "📖 My Classes",
      description: "View your enrolled courses and track your progress.",
      buttonText: "View Classes",
      path: "/my-courses",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icon: "✨"
    },
    {
      title: "✏️ Take Quizzes",
      description: "Complete course quizzes and test your knowledge.",
      buttonText: "Available Quizzes",
      path: "/quizzes",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: "🎯"
    },
    {
      title: "📜 My Quiz History",
      description: "View all your past quiz attempts, scores, and results.",
      buttonText: "View History",
      path: "/history",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      icon: "📊"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Decorative background elements */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>
      <div style={styles.bgBlob3}></div>

      <div style={styles.content}>
        
        {/* WELCOME SECTION */}
        <div style={styles.welcomeSection}>
          <div style={styles.welcomeGradient}></div>
          <div style={styles.welcomeContent}>
            <h2 style={styles.welcomeTitle}>
              Welcome back, {user?.name || "Student"}! 👋
            </h2>
            <p style={styles.welcomeSubtitle}>
              Here is your Learning Management Dashboard. What would you like to do today?
            </p>
          </div>
        </div>

        {/* GRID DASHBOARD */}
        <div style={styles.grid}>
          {menuItems.map((item, index) => (
            <div key={index} style={styles.cardWrapper}>
              <div style={{...styles.card, animation: `slideUp 0.6s ease-out ${index * 0.1}s both`}}>
                {/* Card Header Gradient */}
                <div style={{...styles.cardHeader, background: item.gradient}}>
                  <div style={styles.cardIcon}>{item.icon}</div>
                </div>

                {/* Card Content */}
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardDesc}>{item.description}</p>
                </div>
                
                {/* Button */}
                <button
                  style={{...styles.button, background: item.gradient}}
                  onClick={() => navigate(item.path)}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                >
                  {item.buttonText} →
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// BỘ CSS VỚI DECORATION VÀ ANIMATION
const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    position: "relative",
    overflow: "hidden",
  },

  // Decorative blobs
  bgBlob1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "rgba(102, 126, 234, 0.1)",
    borderRadius: "50%",
    top: "10%",
    right: "10%",
    animation: "float 6s ease-in-out infinite",
  },

  bgBlob2: {
    position: "absolute",
    width: "250px",
    height: "250px",
    background: "rgba(79, 172, 254, 0.1)",
    borderRadius: "50%",
    bottom: "15%",
    left: "5%",
    animation: "float 8s ease-in-out infinite",
  },

  bgBlob3: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "rgba(240, 147, 251, 0.08)",
    borderRadius: "50%",
    top: "50%",
    right: "25%",
    animation: "float 7s ease-in-out infinite",
  },

  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  welcomeSection: {
    textAlign: "center",
    marginBottom: "60px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    position: "relative",
  },

  welcomeGradient: {
    height: "8px",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #43e97b 100%)",
  },

  welcomeContent: {
    padding: "40px 30px",
  },

  welcomeTitle: {
    color: "#2d3748",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 15px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  welcomeSubtitle: {
    color: "#718096",
    fontSize: "16px",
    margin: 0,
    lineHeight: "1.6",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "32px",
  },

  cardWrapper: {
    perspective: "1000px",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
    },
  },

  cardHeader: {
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  cardHeaderOverlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1), transparent)",
  },

  cardIcon: {
    fontSize: "48px",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
    animation: "float 3s ease-in-out infinite",
  },

  cardContent: {
    padding: "24px",
    flexGrow: 1,
  },

  cardTitle: {
    fontSize: "18px",
    margin: "0 0 12px 0",
    fontWeight: "700",
    color: "#2d3748",
  },

  cardDesc: {
    color: "#718096",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },

  button: {
    margin: "16px 24px 24px 24px",
    padding: "14px 24px",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    letterSpacing: "0.5px",
  }
};
