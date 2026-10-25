# ALWAR POLYTECHNIC — STUDENT TALENT MANAGEMENT PORTAL

Official full-stack talent management, student project portfolio, faculty rubric evaluation, and industry licensing platform for **Alwar Polytechnic**.

---

## 1. Project Purpose & Scope

The portal serves **all configured institutional branches and departments** (Computer Science & Engineering, Mechanical Engineering, Civil Engineering, Electrical Engineering, Electronics & Communication Engineering, Automobile Engineering, Chemical Engineering, and Information Technology).

### Key Integrated Modules:
- **Authentication First Entry**: No marketing landing page; opens directly to institutional sign-in/registration with one-click demo account switcher.
- **Role-Based Portals**: Personalized, dedicated experiences for **Students**, **Faculty Evaluators**, **Industry Clients**, and **Institutional Administrators**.
- **Direct Video Upload & HTTP 206 Streaming**: Students upload local MP4/WebM videos directly from their devices into persistent storage. Saved demonstration videos play back seamlessly across refreshes, supporting byte-range requests (`206 Partial Content`).
- **Rubric Evaluator**: Configurable 6-criterion weighted assessment system (Problem understanding 15%, Functionality 25%, Code quality 15%, Innovation 15%, Testing 15%, Documentation 15% = 100%). Computes weighted scores out of 100, captures faculty comments, supports Gemini AI feedback suggestions, and publishes results to students.
- **Client Idea Studio**: Single-page "Describe My Idea" workflow with speech-to-text voice dictation, document attachment, Gemini AI requirement breakdown, and database draft persistence.
- **Attendance Management**: Batch-wise lecture roll-call tracking, automated cumulative attendance percentage computation, and low-attendance (&lt;75%) warnings.
- **Grievance Redressal (Complaints)**: Ticket lifecycle management with category, priority, and administrator resolution note logging.
- **Purchases & Intellectual Property Licensing**: Client deliverables acquisition, authentic license key generation (`LIC-AP-2026-...`), and deliverable package download manifests.
- **Universal Backward Arrow (`←`)**: Working header back navigation across all inner sub-pages preserving state.

---

## 2. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Express on Node.js (`server.ts`), modular REST API (`src/backend/routes.ts`), Multer disk storage.
- **Database Engine**: Persistent JSON/SQLite relational storage with foreign keys, relational constraints, atomic writes (`src/backend/db.ts`).
- **AI Intelligence**: `@google/genai` TypeScript SDK utilizing `gemini-3.8-flash` for client idea scoping, faculty rubric suggestions, and search grounding with honest offline fallbacks.
- **File & Media Storage**: Local persistent disk storage under `/uploads/videos/` and `/uploads/docs/` with HTTP 206 Partial Content streaming.

---

## 3. Demo Accounts (Pre-Seeded)

| Role | Email | Password | Identifier / Department |
| :--- | :--- | :--- | :--- |
| **Student** | `student.demo@alwarpolytechnic.demo` | `Student@123` | PIN: `AP-2023-CS-042` (CSE Sem 5) |
| **Faculty** | `faculty.demo@alwarpolytechnic.demo` | `Faculty@123` | Employee ID: `AP-FAC-108` (No OTP required) |
| **Client** | `client.demo@alwarpolytechnic.demo` | `Client@123` | Apex Industrial Systems & Automation Ltd. |
| **Administrator** | `admin.demo@alwarpolytechnic.demo` | `Admin@123` | Academic Directorate |

*Click any demo account in the collapsible "Explore Demo Accounts" drawer to populate credentials.*

---

## 4. Setup, Installation & Startup Commands

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is specified if live AI capabilities are desired. The portal gracefully falls back to deterministic institutional heuristics if the API key is absent.

### Step 3: Run Automated Test Suite
```bash
npm test
```
Executes 26 unit and workflow tests covering demo accounts, duplicate PIN validation, weighted rubric calculations, attendance percentages, video references, and complaint resolutions.

### Step 4: Development Server
```bash
npm run dev
```
Starts Express full-stack server on port 3000 mounting Vite middleware and backend REST endpoints.

### Step 5: Production Build & Run
```bash
npm run build
npm start
```

---

## 5. API Documentation Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate with email and password. Returns `{ user, profile, token }`.
- `POST /api/auth/register`: Register new student, faculty, or client. Enforces duplicate PIN checks.
- `GET /api/auth/demo-accounts`: Retrieve demo credentials in development mode.

### Projects & Video Streaming (`/api/projects`, `/api/upload/video`)
- `GET /api/projects`: List projects with status, branch, or student filters.
- `GET /api/projects/:id`: Get full project specs, reviews, and rubric evaluation.
- `POST /api/projects`: Create or draft student project.
- `POST /api/upload/video`: Multipart upload saving MP4/WebM to `/uploads/videos/`.
- `GET /uploads/videos/:filename`: HTTP 206 Partial Content video streaming endpoint supporting seek and range requests.

### Rubric Evaluator (`/api/rubrics`)
- `GET /api/rubrics/templates`: Get institutional evaluation templates.
- `POST /api/rubrics/evaluate`: Submit 6-criterion scores (0-10), calculate weighted 0-100 grade, and update project status.

### Client Idea Studio (`/api/ideas`)
- `GET /api/ideas`: Retrieve submitted client requests.
- `POST /api/ideas`: Save draft or submit client problem statement.
- `POST /api/ideas/analyze`: Server-side Gemini AI requirement analysis.

### Attendance (`/api/attendance`)
- `GET /api/attendance`: Retrieve attendance filtered by branch, semester, batch, or date.
- `POST /api/attendance`: Record batch roll-call attendance with present/absent/late status.

### Complaints (`/api/complaints`)
- `GET /api/complaints`: Retrieve user or institutional complaints.
- `POST /api/complaints`: Submit a grievance ticket.
- `POST /api/complaints/:id/resolve`: Administrator marks ticket resolved with notes.

---

## 6. External Service Notice

All AI operations utilize server-side proxy routes via the official `@google/genai` SDK. When `GEMINI_API_KEY` is not present, the portal continues to operate reliably without failure, using built-in institutional rules.
