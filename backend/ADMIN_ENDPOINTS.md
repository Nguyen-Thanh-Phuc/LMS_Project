# Admin Dashboard API Endpoints

## Base URL
`http://localhost:5000/api/admin`

## Dashboard Endpoints

### 1. Get Dashboard Overview
- **Endpoint**: `GET /admin/dashboard/overview`
- **Description**: Get overall statistics including users, courses, enrollments, quizzes, and certificates
- **Response**: 
  ```json
  {
    "users": {
      "total": 45,
      "students": 40,
      "admins": 5
    },
    "content": {
      "courses": 10,
      "lessons": 50,
      "quizzes": 15
    },
    "enrollments": {
      "total": 120,
      "completed": 45,
      "completionRate": "37.50"
    },
    "quizzes": {
      "totalAttempts": 200,
      "passed": 150,
      "passRate": "75.00"
    },
    "certificates": {
      "issued": 45,
      "revoked": 2
    }
  }
  ```

### 2. Get Dashboard Analytics
- **Endpoint**: `GET /admin/dashboard/analytics`
- **Description**: Get detailed analytics including popular courses, recent enrollments, quiz performance, and active users
- **Response**: 
  ```json
  {
    "popularCourses": [...],
    "recentEnrollments": [...],
    "quizPerformance": [...],
    "activeUsers": [...]
  }
  ```

---

## Course Management

### 3. Get All Courses (Admin View)
- **Endpoint**: `GET /admin/courses`
- **Params**: 
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `sort` (default: "-createdAt")
  - `search` (optional keyword)
- **Description**: Get all courses with enrollment and lesson stats
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "title": "React Basics",
        "instructor": {...},
        "stats": {
          "enrollments": 50,
          "lessons": 10,
          "quizzes": 3
        }
      }
    ],
    "pagination": {...}
  }
  ```

### 4. Get Detailed Course Statistics
- **Endpoint**: `GET /admin/courses/:courseId/stats`
- **Description**: Get detailed statistics for a specific course
- **Response**:
  ```json
  {
    "course": {...},
    "stats": {
      "enrollments": 50,
      "lessons": 10,
      "quizzes": 3,
      "certificates": 25,
      "enrollmentProgress": {
        "avgProgress": 65.5,
        "completed": 25
      },
      "quizPerformance": {
        "totalAttempts": 150,
        "avgScore": 78.5,
        "passed": 120
      }
    }
  }
  ```

---

## Student Management

### 5. Get All Students (Admin View)
- **Endpoint**: `GET /admin/students`
- **Params**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)  
  - `sort` (default: "-createdAt")
  - `search` (optional keyword)
- **Description**: Get all students with enrollment and certificate stats
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "stats": {
          "enrollments": 5,
          "completedCourses": 2,
          "certificates": 2
        }
      }
    ],
    "pagination": {...}
  }
  ```

### 6. Get Detailed Student Statistics
- **Endpoint**: `GET /admin/students/:studentId/stats`
- **Description**: Get comprehensive stats for a specific student
- **Response**:
  ```json
  {
    "student": {...},
    "stats": {
      "totalEnrollments": 5,
      "completedCourses": 2,
      "totalAttempts": 20,
      "averageScore": 78.5,
      "certificates": 2
    },
    "enrollments": [...],
    "certificates": [...],
    "recentAttempts": [...]
  }
  ```

---

## Enrollment Management

### 7. Get All Enrollments (Admin View)
- **Endpoint**: `GET /admin/enrollments`
- **Params**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `sort` (default: "-enrolledAt")
  - `courseId` (optional filter)
  - `userId` (optional filter)
- **Description**: Get all enrollments with student and course details
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "userId": {...},
        "courseId": {...},
        "enrolledAt": "2024-01-15",
        "progress": {...}
      }
    ],
    "pagination": {...}
  }
  ```

---

## Quiz Management

### 8. Get All Quizzes (Admin View)
- **Endpoint**: `GET /admin/quizzes`
- **Params**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `sort` (default: "-createdAt")
  - `courseId` (optional filter)
  - `search` (optional keyword)
- **Description**: Get all quizzes with attempt and score stats
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "title": "Quiz 1",
        "courseId": {...},
        "stats": {
          "totalAttempts": 50,
          "passedAttempts": 40,
          "averageScore": 82,
          "passRate": "80.00"
        }
      }
    ],
    "pagination": {...}
  }
  ```

---

## Attempt Management

### 9. Get All Quiz Attempts (Admin View)
- **Endpoint**: `GET /admin/attempts`
- **Params**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `sort` (default: "-createdAt")
  - `quizId` (optional filter)
  - `userId` (optional filter)
  - `passed` (optional: "true" or "false")
- **Description**: Get all quiz attempts with scores and results
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "userId": {...},
        "quizId": {...},
        "score": 8,
        "totalQuestions": 10,
        "percentage": 80,
        "passed": true,
        "createdAt": "2024-01-15"
      }
    ],
    "pagination": {...}
  }
  ```

---

## Certificate Management

### 10. Get All Certificates (Admin View)
- **Endpoint**: `GET /admin/certificates`
- **Params**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `sort` (default: "-completionDate")
  - `courseId` (optional filter)
  - `userId` (optional filter)
  - `status` (optional: "issued" or "revoked")
- **Description**: Get all certificates with completion details
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "...",
        "userId": {...},
        "courseId": {...},
        "certificateId": "CERT-...",
        "studentName": "John Doe",
        "courseName": "React Basics",
        "completionDate": "2024-01-15",
        "status": "issued"
      }
    ],
    "pagination": {...}
  }
  ```

---

## Summary of Admin Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/dashboard/overview` | Main dashboard statistics |
| GET | `/admin/dashboard/analytics` | Detailed analytics |
| GET | `/admin/courses` | All courses with stats |
| GET | `/admin/courses/:courseId/stats` | Detailed course stats |
| GET | `/admin/students` | All students with stats |
| GET | `/admin/students/:studentId/stats` | Detailed student stats |
| GET | `/admin/enrollments` | All enrollments |
| GET | `/admin/quizzes` | All quizzes with stats |
| GET | `/admin/attempts` | All quiz attempts |
| GET | `/admin/certificates` | All certificates |

---

## Example Usage

### Get Dashboard Overview
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/overview
```

### Get All Students (Page 1, 20 items)
```bash
curl -X GET "http://localhost:5000/api/admin/students?page=1&limit=20"
```

### Get Detailed Stats for a Course
```bash
curl -X GET http://localhost:5000/api/admin/courses/courseId123/stats
```

### Get All Enrollments for a Course
```bash
curl -X GET "http://localhost:5000/api/admin/enrollments?courseId=courseId123"
```

### Get Passed Attempts for a Quiz
```bash
curl -X GET "http://localhost:5000/api/admin/attempts?quizId=quizId123&passed=true"
```
