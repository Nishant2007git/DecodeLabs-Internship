# InternHub — Premium Internship Management Portal

DecodeLabs Training Kit Full Stack Project Progression (Modules 1, 2, and 3).

---

## 📂 Project Directory Structure

```
InternHub/
├── frontend/               # Module 1: HTML5, CSS3, ES6 JavaScript
│   ├── index.html          # Public Portal (Home, About, Contact)
│   ├── login.html          # Authentication - Log In
│   ├── register.html       # Authentication - Sign Up
│   ├── dashboard.html      # Dynamic Workspace (Student, Recruiter, Admin)
│   ├── style.css           # Custom Glassmorphic CSS variables style sheet
│   └── script.js           # Client actions, fetch adapters, workspace renderers
├── backend/                # Module 2: Node.js & Express.js APIs
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # authMiddleware (JWT checking)
│   ├── models/             # db.js (PostgreSQL pool connection & mock failover)
│   ├── routes/             # API routes definition
│   └── server.js           # Express main server engine
├── database/               # Module 3: Database Integration
│   └── schema.sql          # PostgreSQL table structures
├── .env.example            # Sample configuration settings
└── package.json            # Node configuration scripts
```

---

## ⚡ Module 2: Express REST API Documentation

All request payloads are JSON format. Guarded endpoints require `Authorization: Bearer <token>` headers.

### 1. Authentication APIs (`/api/auth`)

#### `POST /api/auth/register`
- **Description:** Register a new user account on the platform.
- **Request Body:**
  ```json
  {
    "name": "Nisha Sharma",
    "email": "student@internhub.com",
    "password": "password",
    "role": "student"
  }
  ```
- **Responses:**
  - `201 Created` (Success): Returns JWT token and user info.
  - `400 Bad Request` (Error): Missing fields, duplicate email, password < 6 chars.

#### `POST /api/auth/login`
- **Description:** Authenticate credentials.
- **Request Body:**
  ```json
  {
    "email": "student@internhub.com",
    "password": "password"
  }
  ```
- **Responses:**
  - `200 OK` (Success): Returns JWT token and user profile object.
  - `401 Unauthorized` (Error): Invalid email or password.

---

### 2. Internship APIs (`/api/internships`)

#### `GET /api/internships`
- **Description:** Retrieve all internship listings.
- **Response:** `200 OK` with JSON array of listings mapped with company location data.

#### `GET /api/internships/:id`
- **Description:** Retrieve details for a specific internship listing.
- **Response:** `200 OK` (Success) or `404 Not Found` if the ID is missing.

#### `POST /api/internships` (Guarded: Recruiter/Admin)
- **Description:** Create a new internship listing.
- **Request Body:**
  ```json
  {
    "title": "Backend Systems Engineer",
    "description": "Develop and scale PostgreSQL query modules.",
    "stipend": "$7,500/mo",
    "duration": "6 Months",
    "company_id": 1
  }
  ```
- **Response:** `201 Created` on success.

#### `PUT /api/internships/:id` (Guarded: Recruiter/Admin)
- **Description:** Edit details of a listing.
- **Response:** `200 OK` with updated fields.

#### `DELETE /api/internships/:id` (Guarded: Recruiter/Admin)
- **Description:** Remove a vacancy listing from the platform.
- **Response:** `200 OK` on deletion.

---

### 3. Application APIs (`/api/applications`)

#### `POST /api/applications` (Guarded: Student)
- **Description:** Apply to a vacancy.
- **Request Body:**
  ```json
  {
    "internship_id": 1,
    "cover_pitch": "Highly motivated to optimize canvas render feeds."
  }
  ```
- **Response:** `201 Created` (Success) or `400 Bad Request` if duplicate application.

#### `GET /api/applications` (Guarded)
- **Description:** Query submissions. Students see their personal applications; Recruiters/Admins inspect candidate entries.
- **Response:** `200 OK` with applications list.

#### `PUT /api/applications/:id` (Guarded: Recruiter/Admin)
- **Description:** Advance or change an applicant's stage status in the pipeline.
- **Request Body:**
  ```json
  {
    "status": "Interviewing"
  }
  ```
- **Response:** `200 OK` with modified row.

#### `DELETE /api/applications/:id` (Guarded: Student/Admin)
- **Description:** Cancel and withdraw a submitted application.
- **Response:** `200 OK` on withdrawal.

---

## 🗄️ Module 3: Database Schema Definitions

See database schemas inside [/database/schema.sql](file:///c:/Users/nisha/Downloads/Intern%20Hub/database/schema.sql).

### Entity-Relationship (ER) Diagram Description

1. **`users` Table:**
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR)
   - `email` (VARCHAR UNIQUE)
   - `password` (VARCHAR Hashed)
   - `role` (VARCHAR CHECK: 'student', 'recruiter', 'admin')
   - `created_at` (TIMESTAMP)

2. **`companies` Table:**
   - `id` (SERIAL PRIMARY KEY)
   - `company_name` (VARCHAR)
   - `description` (TEXT)
   - `website` (VARCHAR)
   - `location` (VARCHAR)

3. **`internships` Table:**
   - `id` (SERIAL PRIMARY KEY)
   - `title` (VARCHAR)
   - `description` (TEXT)
   - `stipend` (VARCHAR)
   - `duration` (VARCHAR)
   - `company_id` (INTEGER REFERENCES companies.id ON DELETE CASCADE)
   - `created_at` (TIMESTAMP)

4. **`applications` Table:**
   - `id` (SERIAL PRIMARY KEY)
   - `student_id` (INTEGER REFERENCES users.id ON DELETE CASCADE)
   - `internship_id` (INTEGER REFERENCES internships.id ON DELETE CASCADE)
   - `status` (VARCHAR CHECK: 'Applied', 'Reviewing', 'Interviewing', 'Offered', 'Archived')
   - `applied_at` (TIMESTAMP)

---

## 🚀 Getting Started

1. **Start the server:**
   ```bash
   npm start
   ```
2. **Access the portal:**
   Open **http://localhost:3000** in your browser.
3. **Seed Credentials (Quick Login):**
   - **Student:** `student@internhub.com` / Password: `password`
   - **Recruiter:** `recruiter@internhub.com` / Password: `password`
   - **Admin:** `admin@internhub.com` / Password: `password`
4. **Vetting Simulator Dashboard:**
   In the bottom-right, click the ⚙ icon to access the **Prototype Settings panel**. Here you can toggle the viewport frame (Desktop/Mobile Bezels), change styles (Dark/Light themes), or bypass login by switching roles on-the-fly.
