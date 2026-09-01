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

## 🔄 User Lifecycle Flow

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


