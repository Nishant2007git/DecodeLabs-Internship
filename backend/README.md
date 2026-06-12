# InternHub — Backend API Engine

The InternHub Backend is a high-performance RESTful API service built on **Node.js** and **Express.js**. It provides JWT-based user authentication, role-restricted route guards, and a query runner connected to a PostgreSQL database with an automatic memory-fallback simulator.

---

## 📂 Architecture Structure

The backend follows a modular controller-router-model design pattern:

```
backend/
├── controllers/          # Business logic controllers
│   ├── authController.js        # Registration, login, & token issuance logic
│   ├── internshipController.js  # CRUD logic for job listings
│   └── applicationController.js # Kanban state and application submissions
├── middleware/           # HTTP Request interceptors
│   └── authMiddleware.js        # Validates JWT bearer tokens and sets req.user
├── models/               # Database pool and connection engines
│   └── db.js                    # PostgreSQL pool client with built-in mock fallback
├── routes/               # Express endpoints routes binding
│   ├── auth.js                  # Auth endpoint definitions
│   ├── internships.js           # Vacancy endpoint definitions
│   └── applications.js          # Pipeline endpoint definitions
└── server.js             # Main server entry file
```

---

## ⚡ Core API Endpoints & Request Validation

All API endpoints return JSON payloads. The system enforces request payload validation at the controller level.

---

### 🔐 Authentication (`/api/auth`)

#### `POST /api/auth/register`
*   **Description**: Registers a new user account (Student, Recruiter, or Admin).
*   **Payload (JSON)**:
    ```json
    {
      "name": "Nisha Sharma",
      "email": "student@internhub.com",
      "password": "securepassword123",
      "role": "student"
    }
    ```
*   **Validation Rules**:
    *   `name`, `email`, and `password` are **required** parameters.
    *   `email` must contain an `@` symbol.
    *   `password` must be at least **6 characters** long.
    *   `role` is optional (defaults to `'student'`) and must match the database check constraint: `('student', 'recruiter', 'admin')`.
    *   `email` must be unique (checked against database records).
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully.",
      "token": "JWT_TOKEN_STRING",
      "user": { "id": 1, "name": "Nisha Sharma", "email": "student@internhub.com", "role": "student" }
    }
    ```

#### `POST /api/auth/login`
*   **Description**: Authenticates user credentials and issues a JWT token.
*   **Payload (JSON)**:
    ```json
    {
      "email": "student@internhub.com",
      "password": "securepassword123"
    }
    ```
*   **Validation Rules**:
    *   `email` and `password` are **required** parameters.
    *   Credentials must match active database records (hashed password check via `bcrypt.compare`).
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "token": "JWT_TOKEN_STRING",
      "user": { "id": 1, "name": "Nisha Sharma", "email": "student@internhub.com", "role": "student" }
    }
    ```

---

### 💼 Internship Listings (`/api/internships`)

#### `GET /api/internships`
*   **Description**: Retrieves a list of all active internships.
*   **Authentication**: None.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "title": "Frontend Engineer (React)",
          "description": "...",
          "stipend": "$7,500/mo",
          "duration": "6 Months",
          "company_id": 1,
          "company_name": "Linear",
          "location": "Remote",
          "website": "https://linear.app",
          "created_at": "..."
        }
      ]
    }
    ```

#### `GET /api/internships/:id`
*   **Description**: Retrieves detailed info for a single internship.
*   **Authentication**: None.
*   **Response (200 OK)**: Returns the matching internship or `404 Not Found` if the ID doesn't exist.

#### `POST /api/internships`
*   **Description**: Creates a new internship listing.
*   **Authentication**: Required (JWT Bearer Token).
*   **Authorized Roles**: `recruiter` or `admin` only.
*   **Payload (JSON)**:
    ```json
    {
      "title": "Backend Developer (Node)",
      "description": "Build high-throughput APIs...",
      "stipend": "$8,000/mo",
      "duration": "3 Months",
      "company_id": 1
    }
    ```
*   **Validation Rules**:
    *   `title`, `description`, `stipend`, and `duration` are **required**.
    *   `company_id` is optional (defaults to `1` - Linear).
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Internship created successfully.",
      "data": { ... }
    }
    ```

#### `DELETE /api/internships/:id`
*   **Description**: Deletes an internship vacancy.
*   **Authentication**: Required (JWT Bearer Token).
*   **Authorized Roles**: `recruiter` or `admin` only.
*   **Response (200 OK)**: Success status message.

---

### 🗂️ Application Pipeline (`/api/applications`)

All operations below require a valid **Authorization Header** containing a bearer token:
`Authorization: Bearer <JWT_TOKEN>`

#### `POST /api/applications`
*   **Description**: Submits an application for an internship vacancy.
*   **Authorized Roles**: `student` only.
*   **Payload (JSON)**:
    ```json
    {
      "internship_id": 1
    }
    ```
*   **Validation Rules**:
    *   `internship_id` is a **required** parameter.
    *   A student cannot apply to the same internship multiple times (enforced via database check constraints).
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Application submitted successfully.",
      "data": { "id": 1, "student_id": 1, "internship_id": 1, "status": "Applied", "applied_at": "..." }
    }
    ```

#### `GET /api/applications`
*   **Description**: Retrieves applications.
    *   **Students** see only their own application submissions.
    *   **Recruiters and Admins** see all submissions with student details (name, email).
*   **Response (200 OK)**: JSON array of application structures.

#### `PUT /api/applications/:id`
*   **Description**: Updates the pipeline Kanban status of an application.
*   **Authorized Roles**: `recruiter` or `admin` only.
*   **Payload (JSON)**:
    ```json
    {
      "status": "Interviewing"
    }
    ```
*   **Validation Rules**:
    *   `status` is **required** and must match check constraints: `('Applied', 'Reviewing', 'Interviewing', 'Offered', 'Archived')`.
*   **Response (200 OK)**: Returns the updated application record.

#### `DELETE /api/applications/:id`
*   **Description**: Cancels/withdraws an application submission.
*   **Authorized Roles**: `student` (only for their own application) or `admin`.
*   **Response (200 OK)**: Status validation message.

---

### ⚙️ System Administration (`/api/users`)

#### `GET /api/users`
*   **Description**: Retrieves a database list of all system users.
*   **Authentication**: Required (JWT Bearer Token).
*   **Authorized Roles**: `admin` only.
*   **Response (200 OK)**: JSON array containing user profiles (id, name, email, role, created_at).

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root of the project with the following configuration variables:

```ini
# Server Setup
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

# PostgreSQL Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=internhub
DB_PASSWORD=your_database_password_here
DB_PORT=5432
```
> [!NOTE]
> If database credentials are not provided or if the PostgreSQL server is offline, the backend will automatically initialize an **in-memory database simulator** using seeded initial data, allowing you to preview the app instantly.

---

## 🚀 Execution & Setup Commands

Ensure you have [Node.js](https://nodejs.org/) installed, then run these commands from the **project root directory**:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database (PostgreSQL)
Ensure your PostgreSQL database is running, then run the schema file to build and seed tables:
```bash
psql -U postgres -d internhub -f database/schema.sql
```

### 3. Start the Server
To run the server in development mode:
```bash
npm start
```
The console will log the active port and DB status:
```
⚡ PostgreSQL pool configured.
===============================================
🚀 InternHub Web Application Listening on PORT: 3000
🌍 Preview address: http://localhost:3000
===============================================
```

---

## 📈 Technical Improvements & Recommendations

To bring the codebase to an enterprise-ready production standard, the following improvements are recommended:

1. **Database Migration Framework**:
   * *Issue*: Current setup uses a raw SQL schema script.
   * *Fix*: Implement an ORM or migration engine (e.g., **Prisma**, **Sequelize**, or **Knex.js**) to version schema upgrades and automate seeding.
2. **Robust Input Validation**:
   * *Issue*: Incoming payload parameters are unchecked, exposing the server to SQL injection risks or bad inputs.
   * *Fix*: Integrate a schema validation library like **Zod** or **Joi** to validate headers and body parameters before they hit the controller.
3. **Structured Logging**:
   * *Issue*: Debugging logs use standard stdout `console.log`.
   * *Fix*: Incorporate **Winston** for severity-level logs and file transport, combined with **Morgan** for HTTP traffic logging.
4. **Enhanced Security Headers**:
   * *Issue*: Lack of standard security middleware configurations.
   * *Fix*: Add **Helmet** middleware to configure security headers and integrate the **CORS** package to restrict API consumption to approved domains.
5. **Database Transaction Support**:
   * *Issue*: Related insertions (e.g. applications, notifications) run on isolated connections.
   * *Fix*: Use SQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) in controllers to prevent database inconsistency in case of pipeline failures.
6. **Automated Testing Suite**:
   * *Issue*: Lack of validation tests for authentication or application flow.
   * *Fix*: Add unit and integration tests using **Jest** and **Supertest** to verify controller responses and authentication guards.
