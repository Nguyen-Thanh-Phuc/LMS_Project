# LMS Project - Learning Management System

A comprehensive Learning Management System (LMS) built with modern web technologies. This platform enables educational institutions to manage courses, students, quizzes, and learning progress efficiently.

## 🎯 Features

- **User Management**: Student and instructor authentication with JWT
- **Course Management**: Create, manage, and organize courses with lessons
- **Quiz System**: Create quizzes with multiple questions and track student attempts
- **Progress Tracking**: Monitor student enrollment, quiz attempts, and certificates
- **Admin Dashboard**: Comprehensive dashboard for administrators to manage all system resources
- **Email Notifications**: Send password reset and notification emails
- **Cloud Storage**: Image uploads via Cloudinary integration
- **RESTful API**: Well-documented API endpoints with Swagger documentation

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS
- **HTTP Client**: Axios
- **Router**: React Router

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn** (v8 or higher)
- **MongoDB** (local or MongoDB Atlas connection string)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nguyen-Thanh-Phuc/LMS_Project.git
cd LMS_Project
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test
```

For test coverage:
```bash
npm test -- --coverage
```

## 📁 Project Structure

```
LMS_Project/
├── backend/
│   ├── config/          # Database and service configurations
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── test/            # Test suite
│   ├── utils/           # Utility functions
│   ├── server.js        # Main server file
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── assets/      # Static assets
│   │   ├── App.jsx      # Main App component
│   │   └── main.jsx     # Entry point
│   ├── public/          # Public assets
│   └── package.json
│
└── README.md
```

## 📚 API Documentation

### Swagger Documentation

Once the backend is running, access the API documentation at:
```
http://localhost:5000/api-docs
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

#### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create a course (Admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

#### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create a quiz (Instructor)
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/submit` - Submit quiz attempt

#### Enrollments
- `POST /api/enrollments` - Enroll in a course
- `GET /api/enrollments` - Get user enrollments
- `GET /api/enrollments/:courseId` - Get course enrollments (Admin)

#### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/attempts` - View all attempts
- `GET /api/admin/certificates` - View certificates

For complete API documentation, refer to `ADMIN_ENDPOINTS.md` in the backend folder.

## 📊 User Roles

- **Student**: Can enroll in courses, take quizzes, and view progress
- **Instructor**: Can create courses and quizzes, manage students
- **Admin**: Full system management and monitoring

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Request validation middleware
- Error handling middleware

## 📧 Email Features

The system sends emails for:
- Password reset requests
- Quiz completion notifications
- Certificate generation

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## � Authors

**Nguyen Thanh Phuc**
- GitHub: [@Nguyen-Thanh-Phuc](https://github.com/Nguyen-Thanh-Phuc)

**VDLuong3001**
- GitHub: [@VDLuong3001](https://github.com/VDLuong3001)

**HoangVuong484**
- GitHub: [@HoangVuong484](https://github.com/HoangVuong484)

## 📞 Support & Questions

For questions or support, please open an issue on the GitHub repository.

---

**Happy Learning! 🎓**
