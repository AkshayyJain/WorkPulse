# WorkPulse - Enterprise Employee Work & Weekly Reporting System

An enterprise weekly work tracking and management reporting platform built with **React + Vite** on the frontend, **Python FastAPI** and **Node.js Express** on the backend, **MongoDB / MongoDB Atlas** and embedded JSON storage for data persistence, **JWT-based authentication**, and **Google Gemini AI** for automated executive summaries.

---

## 📋 Technology Stack Verification

| Requirement | Implementation | Status |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Motion | ✅ Implemented |
| **Backend** | Dual support: Python 3 + FastAPI (`main.py` / `server.py`) & Node.js + Express (`server.ts`) | ✅ Implemented |
| **Database** | Dual support: MongoDB / MongoDB Atlas & embedded JSON persistent store | ✅ Implemented |
| **Authentication** | JWT (HMAC-SHA256) & RBAC (`EMPLOYEE` vs `MANAGER`) with password hashing | ✅ Implemented |
| **AI Synthesis** | Google Gemini API (`gemini-3.7-flash` via `@google/genai` SDK) + High-Precision Fallback | ✅ Implemented |
| **Export** | jsPDF client-side formatted PDF generator | ✅ Implemented |
| **Deployment** | Vercel (`vercel.json`), Render, Cloud Run, or Docker Container | ✅ Implemented |

---

## 🌟 Key Capabilities

- **Role-Based Access Control (RBAC)**: Distinct views and permission models for Employees and Managers.
- **Daily Work Log Tracker**: Log hours spent, project tags (Frontend, Backend, DevOps, etc.), dates, and descriptions.
- **Weekly 4-Question Workflow**: Structured reporting with drafts, auto-saving, field validation, and lock-on-submit.
- **AI Executive Summarization**: Automated analysis of daily work items and answers into structured summaries (Overview, Key Accomplishments, In Progress, Blockers, Priorities).
- **Manager Command Center**: Track team submission rates, review reports, provide structured feedback, and update approval statuses (`APPROVED`, `NEEDS_REVISION`).
- **One-Click PDF Export**: Download clean executive PDF reports for offline archiving.
- **Theme Switching**: Dark and light modes with WCAG-compliant contrast ratios.

---

## 🔄 API & User Lifecycle Flow

1. **Login & Session Acquisition**: User authenticates with email/password to receive a signed JWT token and user profile with assigned role and manager mapping.
2. **Retrieve Question Templates**: Frontend fetches active question templates (Accomplishments, In Progress, Blockers, Next Week Priorities).
3. **Log Daily Updates**: Employee records tasks with time spent, project categorization tags, and details.
4. **Draft Weekly Report**: Employee fills answers to the 4 weekly questions with real-time auto-saving.
5. **Submit & Lock Report**: Validates all responses, locks report status to `SUBMITTED`, and updates the audit log.
6. **Generate AI Summary**: Google Gemini API analyzes logged daily hours and question answers to synthesize an executive brief.
7. **Manager Review & Feedback**: Manager reviews team dashboard, inspects direct reports' submissions and AI briefs, and submits reviews or feedback.

---

## 🛡️ Role-Based Access Control (RBAC)

- **Employees**: Can view, edit, and submit only their own daily work updates and weekly reports. Cannot modify submitted reports unless requested for revision.
- **Managers**: Can view submission statuses, analytics, and generated reports strictly for direct reports assigned in their hierarchy (`managerId`). Managers can approve reports or request revisions.

---

## 🔑 Pre-Configured Demo Accounts

| Role | Name | Email | Password | Assigned Scope / Direct Reports |
|---|---|---|---|---|
| **Manager** | Sarah Connor | `manager1@example.com` | `Manager@123` | Engineering Manager (Alex, Maya, Liam) |
| **Manager** | David Miller | `manager2@example.com` | `Manager@123` | Director of Product (Jordan, Chloe) |
| **Employee** | Alex Rivera | `employee1@example.com` | `Employee@123` | Senior Full-Stack Engineer |
| **Employee** | Maya Chen | `employee2@example.com` | `Employee@123` | Frontend Specialist |
| **Employee** | Liam Wilson | `employee3@example.com` | `Employee@123` | DevOps Engineer |
| **Employee** | Jordan Taylor | `employee4@example.com` | `Employee@123` | UI/UX Designer |
| **Employee** | Chloe Vance | `employee5@example.com` | `Employee@123` | Product QA Specialist |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (see `.env.example` for reference):

```env
# ==============================================================================
# AI & LLM Configuration
# ==============================================================================
# Gemini API Key obtained from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model identifier (Defaults to gemini-3.7-flash)
AI_MODEL=gemini-3.7-flash

# ==============================================================================
# Application & Hosting Configuration
# ==============================================================================
# Port for the server (Default: 3000)
PORT=3000

# Base URL where the application or API is hosted
APP_URL=http://localhost:3000

# Node environment mode: 'development' or 'production'
NODE_ENV=development

# Allowed CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ==============================================================================
# Authentication & Security
# ==============================================================================
# Secret key used for signing and verifying JWT tokens (min 32 chars recommended)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# Token expiration duration in minutes (Default: 1440 = 24 hours)
JWT_EXPIRE_MINUTES=1440

# ==============================================================================
# Database Configuration (Optional - embedded store used if omitted)
# ==============================================================================
# MongoDB Connection String (e.g., MongoDB Atlas or local instance)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=workpulse_db
```

---

## 🧠 Selected AI Model & Provider Rationale

### Selected Provider: **Google Gemini API (`@google/genai` TypeScript SDK / Python SDK)**
### Selected Model: **`gemini-3.7-flash`** (with dynamic fallback to `gemini-2.5-flash`)

### Architectural Justification:

1. **Low Latency & High Throughput**:
   - `gemini-3.7-flash` provides near-instant inference (~600–1200ms), ensuring immediate feedback when employees submit weekly reports or when managers request on-demand summaries.
2. **Native JSON Schema & Structured Output Enforcement**:
   - WorkPulse requires strict JSON data structures (`executiveSummary`, `keyAccomplishments`, `currentWork`, `blockers`, `nextWeekPriorities`). Gemini's `responseMimeType: "application/json"` guarantees consistent schema adherence without regex or formatting failures.
3. **High Factual Grounding & Anti-Hallucination**:
   - Corporate reporting demands strict fidelity to logged data. The system prompt instructs Gemini to summarize strictly based on the employee's logged hours, task descriptions, and explicit question answers without inventing metrics, deliverables, or dates.
4. **Token Economics**:
   - Flash-class models provide industry-leading token cost economics for recurring organizational reporting workflows.
5. **Resilient Offline / Graceful Fallback Architecture**:
   - If an external API key is omitted or a rate limit occurs, the application features an automatic deterministic synthesizer fallback so report generation and submission never fail.

---

## 📡 API Route Overview

All API endpoints are prefixed with `/api`. Protected routes require the `Authorization: Bearer <JWT_TOKEN>` header.

### 1. System Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns service health, database connectivity status, and AI configuration |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates user with `email` and `password`. Returns JWT token & user object |
| `GET` | `/api/auth/me` | Bearer | Returns the authenticated user's profile and permissions |
| `POST` | `/api/auth/logout` | Bearer | Invalidates the current session |

### 3. Weekly Questions (`/api/questions`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/questions` | Bearer | Fetches the active 4-question reporting schema |

### 4. Daily Work Updates (`/api/work-updates`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/work-updates` | Employee/Manager | Lists daily work updates (filtered by employee and date range) |
| `POST` | `/api/work-updates` | Employee | Logs a new daily task (`workDate`, `hoursSpent`, `projectTag`, `description`) |
| `PUT` | `/api/work-updates/:id` | Employee | Modifies an existing work entry |
| `DELETE` | `/api/work-updates/:id` | Employee | Deletes a logged work entry |

### 5. Weekly Reports (`/api/reports`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Employee/Manager | Lists weekly reports submitted by or accessible to the user |
| `GET` | `/api/reports/:id` | Employee/Manager | Retrieves a specific weekly report with answers and AI summary |
| `POST` | `/api/reports` | Employee | Creates or updates a draft weekly report |
| `POST` | `/api/reports/:id/submit` | Employee | Submits and locks the weekly report, triggering AI summary generation |
| `POST` | `/api/reports/:id/generate-summary` | Employee/Manager | Manually triggers or regenerates the Gemini AI executive summary |
| `POST` | `/api/reports/:id/review` | Manager | Submits manager review (`status`: `APPROVED`/`NEEDS_REVISION`, `managerFeedback`) |

### 6. Manager Dashboard (`/api/manager`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/manager/team-members` | Manager | Lists all direct reports assigned under the authenticated manager |
| `GET` | `/api/manager/team-reports` | Manager | Retrieves weekly submissions and statistics across all team members |
| `GET` | `/api/manager/team-stats` | Manager | Aggregates team submission rates, total hours logged, and blocker alerts |

---

## 🚀 Local Setup & Installation

### Option 1: Full-Stack Node.js (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/workpulse.git
   cd workpulse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Open .env and add your GEMINI_API_KEY and JWT_SECRET
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

### Option 2: Python FastAPI Backend + React Frontend

1. **Setup Python Backend**:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Setup Frontend**:
   ```bash
   npm install
   VITE_API_BASE=http://localhost:8000/api npm run dev
   ```

---

## 🚢 Deployment Instructions

### 1. Backend Deployment (Render - Python FastAPI)
1. In Render, click **New + > Web Service** and select your GitHub repository.
2. Configure the following:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `JWT_SECRET`: `your-secure-jwt-secret`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
   - `GEMINI_API_KEY`: `your-gemini-api-key`

### 2. Frontend Deployment (Vercel - React + Vite)
1. In Vercel, click **Add New > Project** and import your GitHub repository.
2. Configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set the Environment Variable:
   - `VITE_API_BASE`: Set to your Render backend URL (e.g., `https://workpulse-api.onrender.com/api`)
4. Click **Deploy**.

### 3. Container / Cloud Run Deployment (Full-Stack)
1. Build the production package:
   ```bash
   npm run build
   ```
2. Start the compiled CommonJS bundle:
   ```bash
   node dist/server.cjs
   ```
