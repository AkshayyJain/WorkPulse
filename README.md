# WorkPulse - Enterprise Employee Work & Weekly Reporting System

An enterprise weekly work tracking and management reporting platform built with **React + Vite** on the frontend, **Python FastAPI** on the backend, **MongoDB / MongoDB Atlas** for data persistence, **JWT-based authentication**, and **Google Gemini AI** for executive summaries.

---

## 📋 Technology Stack Verification

| Requirement | Implementation | Status |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS | ✅ Implemented |
| **Backend** | Python 3 + FastAPI (`main.py` / `server.py`) | ✅ Implemented |
| **Database** | MongoDB / MongoDB Atlas schema with document persistence | ✅ Implemented |
| **Authentication** | JWT (HMAC-SHA256) & RBAC (`EMPLOYEE` vs `MANAGER`) | ✅ Implemented |
| **AI Synthesis** | Google Gemini API (`gemini-3.7-flash`) + High-Precision Fallback | ✅ Implemented |
| **Deployment** | React on Vercel (`vercel.json`) & Python API on Render | ✅ Implemented |

---

## 🔄 API Lifecycle Flow

The application strictly executes the full required lifecycle:
1. **Login**: Authenticate with email/password to receive JWT and user profile.
2. **Get Weekly Questions**: Fetch active question templates (Accomplishments, In Progress, Blockers, Priorities).
3. **Add Work Updates**: Log daily hours, descriptions, and project tags.
4. **Answer Questions**: Draft responses with automatic local & remote auto-saving.
5. **Submit Report**: Validates all fields, locks report to `SUBMITTED`, and updates audit logs.
6. **Generate AI Summary**: Google Gemini API analyzes logged hours and answers to produce executive briefs.
7. **Manager Views Report**: Manager reviews team dashboard, individual employee submissions, and AI executive summaries.

---

## 🛡️ Role-Based Access Control (RBAC)
- **Employees**: Can view, log, and submit only their own daily work updates and weekly reports.
- **Managers**: Can access submissions and analytics strictly for direct reports in their assigned hierarchy (`managerId`).

---

## 🔑 Pre-Configured Demo Accounts

| Role | Name | Email | Password | Assigned Scope |
|---|---|---|---|---|
| **Manager** | Sarah Connor | `manager1@example.com` | `Manager@123` | Engineering Manager (Alex, Maya, Liam) |
| **Manager** | David Miller | `manager2@example.com` | `Manager@123` | Director of Product (Jordan, Chloe) |
| **Employee** | Alex Rivera | `employee1@example.com` | `Employee@123` | Senior Full-Stack Engineer |
| **Employee** | Maya Chen | `employee2@example.com` | `Employee@123` | Frontend Specialist |
| **Employee** | Liam Wilson | `employee3@example.com` | `Employee@123` | DevOps Engineer |

---

## 🚀 Deployment Instructions

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
   - `VITE_API_BASE`: Set to your Render backend URL (e.g. `https://workpulse-api.onrender.com/api`)
4. Click **Deploy**.
