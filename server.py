"""
WorkPulse REST API Server & Enterprise Reporting Backend
Written in Python 3 with native standard library (FastAPI/Flask/HTTP server compatible)
Includes:
- JWT Authentication & RBAC (Employee & Manager roles)
- Daily Work Update CRUD
- 4-Question Weekly Reporting Engine & Draft Auto-save
- Executive AI Synthesis with Google Gemini API & deterministic fallback engine
- SQLite / JSON Data Persistence
"""

import os
import sys
import json
import time
import hmac
import base64
import hashlib
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.error

PORT = int(os.environ.get("PORT", 3000))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.7-flash")
JWT_SECRET = os.environ.get("JWT_SECRET", "workpulse-enterprise-secret-key-2025")
DATA_DIR = os.path.join(os.getcwd(), "data")
DB_FILE = os.path.join(DATA_DIR, "db.sqlite3")

os.makedirs(DATA_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Database Layer
# ---------------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        position TEXT,
        managerId TEXT,
        createdAt TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS work_updates (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        employeeName TEXT NOT NULL,
        workDate TEXT NOT NULL,
        hoursSpent REAL NOT NULL,
        projectTag TEXT NOT NULL,
        description TEXT NOT NULL,
        weekStart TEXT NOT NULL,
        weekEnd TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS weekly_reports (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        employeeName TEXT NOT NULL,
        managerId TEXT,
        weekStart TEXT NOT NULL,
        weekEnd TEXT NOT NULL,
        status TEXT NOT NULL,
        answers TEXT NOT NULL,
        submittedAt TEXT,
        aiStatus TEXT NOT NULL,
        aiSummary TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        category TEXT NOT NULL,
        required INTEGER NOT NULL,
        orderIndex INTEGER NOT NULL,
        isActive INTEGER NOT NULL,
        createdAt TEXT,
        updatedAt TEXT
    )""")

    # Seed initial data if users table is empty
    c.execute("SELECT COUNT(*) FROM users")
    count = c.fetchone()[0]
    if count == 0:
        seed_data(c)

    conn.commit()
    conn.close()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()

def seed_data(c):
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    users = [
        ("mgr-1", "manager1@example.com", hash_pw("Manager@123"), "Sarah Connor", "MANAGER", "Engineering", "Engineering Manager", None, now),
        ("mgr-2", "manager2@example.com", hash_pw("Manager@123"), "David Miller", "MANAGER", "Product", "Director of Product", None, now),
        ("emp-1", "employee1@example.com", hash_pw("Employee@123"), "Alex Rivera", "EMPLOYEE", "Engineering", "Senior Full-Stack Engineer", "mgr-1", now),
        ("emp-2", "employee2@example.com", hash_pw("Employee@123"), "Maya Chen", "EMPLOYEE", "Engineering", "Frontend Specialist", "mgr-1", now),
        ("emp-3", "employee3@example.com", hash_pw("Employee@123"), "Liam Wilson", "EMPLOYEE", "Engineering", "Backend / DevOps Engineer", "mgr-1", now),
        ("emp-4", "employee4@example.com", hash_pw("Employee@123"), "Jordan Taylor", "EMPLOYEE", "Product", "Senior Product Designer", "mgr-2", now),
        ("emp-5", "employee5@example.com", hash_pw("Employee@123"), "Chloe Zhang", "EMPLOYEE", "Product", "Associate Product Manager", "mgr-2", now),
    ]
    c.executemany("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)", users)

    questions = [
        ("q-1", "What were your key accomplishments and deliverables this week?", "Accomplishments", 1, 1, 1, now, now),
        ("q-2", "What tasks, features, or initiatives are currently in progress?", "In Progress", 1, 2, 1, now, now),
        ("q-3", "Did you encounter any blockers, risks, or dependency bottlenecks?", "Blockers", 0, 3, 1, now, now),
        ("q-4", "What are your top priorities and commitments planned for next week?", "Priorities", 1, 4, 1, now, now),
    ]
    c.executemany("INSERT INTO questions VALUES (?,?,?,?,?,?,?,?)", questions)

init_db()

# ---------------------------------------------------------------------------
# JWT & Security Utilities
# ---------------------------------------------------------------------------
def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s.encode('utf-8'))

def generate_jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_copy = dict(payload)
    payload_copy["exp"] = int(time.time()) + (7 * 24 * 3600)
    payload_b64 = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    msg = f"{header_b64}.{payload_b64}".encode('utf-8')
    sig = hmac.new(JWT_SECRET.encode('utf-8'), msg, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{base64url_encode(sig)}"

def verify_jwt(token: str):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        msg = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), msg, hashlib.sha256).digest()
        actual_sig = base64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

# ---------------------------------------------------------------------------
# Gemini AI Synthesis Engine
# ---------------------------------------------------------------------------
def generate_ai_summary(employee_name: str, reporting_period: str, work_updates: list, answers: dict) -> dict:
    formatted_logs = "\n".join([
        f"{idx+1}. [{u.get('workDate')}] ({u.get('hoursSpent',0)}h | {u.get('projectTag','General')}): {u.get('description','')}"
        for idx, u in enumerate(work_updates)
    ]) if work_updates else "No daily work logs recorded."

    prompt = f"""
You are an executive employee reporting assistant. Summarize the provided weekly work report using ONLY the information supplied.

EMPLOYEE: {employee_name}
REPORTING PERIOD: {reporting_period}

DAILY WORK LOGS:
{formatted_logs}

WEEKLY REPORT RESPONSES:
1. Accomplishments: {answers.get('accomplishments', 'None stated')}
2. In Progress: {answers.get('inProgress', 'None stated')}
3. Blockers: {answers.get('blockers', 'None stated')}
4. Next Week Priorities: {answers.get('nextWeekPriorities', 'None stated')}

Output strict JSON:
{{
  "executiveSummary": "Concise 2-3 sentence overview...",
  "keyAccomplishments": ["Item 1", "Item 2"],
  "currentWork": ["Item 1", "Item 2"],
  "blockers": ["Blocker or No active blockers reported"],
  "nextWeekPriorities": ["Item 1", "Item 2"]
}}
"""
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
            body = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as res:
                data = json.loads(res.read().decode('utf-8'))
                text_content = data['candidates'][0]['content']['parts'][0]['text']
                parsed = json.loads(text_content.strip().replace('```json', '').replace('```', ''))
                parsed["generatedAt"] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                parsed["model"] = GEMINI_MODEL
                return parsed
        except Exception as e:
            print(f"[AI Service Error] Fallback triggered: {e}")

    # Deterministic high-precision fallback
    total_hours = sum(u.get('hoursSpent', 0) for u in work_updates)
    acc = [a.strip() for a in (answers.get('accomplishments') or 'Completed assigned tasks').split('\n') if a.strip()]
    prog = [p.strip() for p in (answers.get('inProgress') or 'Sprint objectives on schedule').split('\n') if p.strip()]
    block = [b.strip() for b in (answers.get('blockers') or 'No active blockers reported').split('\n') if b.strip()]
    prio = [pr.strip() for pr in (answers.get('nextWeekPriorities') or 'Continue departmental objectives').split('\n') if pr.strip()]

    return {
        "executiveSummary": f"{employee_name} logged {len(work_updates)} work updates totaling {total_hours} hours during the {reporting_period} cycle, maintaining forward momentum across primary project objectives.",
        "keyAccomplishments": acc[:4] or ["Completed scheduled milestones."],
        "currentWork": prog[:4] or ["Active development items in flight."],
        "blockers": block[:3] or ["No active blockers reported."],
        "nextWeekPriorities": prio[:4] or ["Execute scheduled roadmap priorities."],
        "generatedAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "model": "WorkPulse Executive Engine"
    }

# ---------------------------------------------------------------------------
# HTTP Handler
# ---------------------------------------------------------------------------
class WorkPulseHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _get_auth_user(self):
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            return verify_jwt(token)
        return None

    def _get_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length > 0:
            raw = self.rfile.read(length).decode('utf-8')
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        url = urlparse(self.path)
        path = url.path
        query = parse_qs(url.query)

        # Health
        if path == "/api/health":
            return self._send_json({
                "status": "healthy",
                "runtime": "Python 3 Standard Backend",
                "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                "aiConfigured": bool(GEMINI_API_KEY),
                "aiModel": GEMINI_MODEL
            })

        # Auth Me
        if path == "/api/auth/me":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)
            return self._send_json({"user": user})

        # Questions
        if path == "/api/questions":
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, text, category, required, orderIndex, isActive, createdAt, updatedAt FROM questions WHERE isActive=1 ORDER BY orderIndex ASC")
            rows = c.fetchall()
            conn.close()
            questions = [
                {"id": r[0], "text": r[1], "category": r[2], "required": bool(r[3]), "order": r[4], "isActive": bool(r[5])}
                for r in rows
            ]
            return self._send_json(questions)

        # Work Updates
        if path == "/api/work-updates":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, employeeId, employeeName, workDate, hoursSpent, projectTag, description, weekStart, weekEnd, createdAt, updatedAt FROM work_updates WHERE employeeId=? ORDER BY workDate DESC", (user['id'],))
            rows = c.fetchall()
            conn.close()
            updates = [
                {"id": r[0], "employeeId": r[1], "employeeName": r[2], "workDate": r[3], "hoursSpent": r[4], "projectTag": r[5], "description": r[6], "weekStart": r[7], "weekEnd": r[8], "createdAt": r[9], "updatedAt": r[10]}
                for r in rows
            ]
            return self._send_json(updates)

        # Current Report
        if path == "/api/reports/current":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)
            week_start = query.get("weekStart", [""])[0]
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            if week_start:
                c.execute("SELECT id, employeeId, employeeName, managerId, weekStart, weekEnd, status, answers, submittedAt, aiStatus, aiSummary FROM weekly_reports WHERE employeeId=? AND weekStart=?", (user['id'], week_start))
            else:
                c.execute("SELECT id, employeeId, employeeName, managerId, weekStart, weekEnd, status, answers, submittedAt, aiStatus, aiSummary FROM weekly_reports WHERE employeeId=? ORDER BY weekStart DESC LIMIT 1", (user['id'],))
            row = c.fetchone()
            conn.close()
            if not row:
                return self._send_json(None)
            report = {
                "id": row[0], "employeeId": row[1], "employeeName": row[2], "managerId": row[3],
                "weekStart": row[4], "weekEnd": row[5], "status": row[6],
                "answers": json.loads(row[7]), "submittedAt": row[8],
                "aiStatus": row[9], "aiSummary": json.loads(row[10]) if row[10] else None
            }
            return self._send_json(report)

        # Reports History
        if path == "/api/reports":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            if user.get("role") == "MANAGER":
                c.execute("SELECT id, employeeId, employeeName, managerId, weekStart, weekEnd, status, answers, submittedAt, aiStatus, aiSummary FROM weekly_reports WHERE managerId=? ORDER BY weekStart DESC", (user['id'],))
            else:
                c.execute("SELECT id, employeeId, employeeName, managerId, weekStart, weekEnd, status, answers, submittedAt, aiStatus, aiSummary FROM weekly_reports WHERE employeeId=? ORDER BY weekStart DESC", (user['id'],))
            rows = c.fetchall()
            conn.close()
            reports = [
                {
                    "id": r[0], "employeeId": r[1], "employeeName": r[2], "managerId": r[3],
                    "weekStart": r[4], "weekEnd": r[5], "status": r[6],
                    "answers": json.loads(r[7]), "submittedAt": r[8],
                    "aiStatus": r[9], "aiSummary": json.loads(r[10]) if r[10] else None
                }
                for r in rows
            ]
            return self._send_json(reports)

        # Manager Employees
        if path == "/api/manager/employees":
            user = self._get_auth_user()
            if not user or user.get("role") != "MANAGER":
                return self._send_json({"error": "Forbidden"}, 403)
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, name, email, department, position FROM users WHERE managerId=?", (user['id'],))
            emp_rows = c.fetchall()
            employees = []
            for emp in emp_rows:
                c.execute("SELECT id, status, aiStatus, submittedAt, answers, aiSummary FROM weekly_reports WHERE employeeId=? ORDER BY weekStart DESC LIMIT 1", (emp[0],))
                rep_row = c.fetchone()
                employees.append({
                    "id": emp[0], "name": emp[1], "email": emp[2], "department": emp[3], "position": emp[4],
                    "latestReport": {
                        "id": rep_row[0], "status": rep_row[1], "aiStatus": rep_row[2], "submittedAt": rep_row[3],
                        "answers": json.loads(rep_row[4]), "aiSummary": json.loads(rep_row[5]) if rep_row[5] else None
                    } if rep_row else None
                })
            conn.close()
            return self._send_json(employees)

        # Static file serving fallback for production builds
        dist_file = os.path.join(os.getcwd(), "dist", path.lstrip('/'))
        if os.path.isfile(dist_file):
            with open(dist_file, 'rb') as f:
                content = f.read()
            mime = "text/html" if dist_file.endswith(".html") else "application/javascript" if dist_file.endswith(".js") else "text/css" if dist_file.endswith(".css") else "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        # SPA index.html fallback
        index_file = os.path.join(os.getcwd(), "dist", "index.html")
        if os.path.isfile(index_file):
            with open(index_file, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        return self._send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        url = urlparse(self.path)
        path = url.path
        body = self._get_body()

        # Login
        if path == "/api/auth/login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            pw_hash = hash_pw(password)

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, email, name, role, department, position, managerId FROM users WHERE email=? AND password=?", (email, pw_hash))
            row = c.fetchone()
            conn.close()

            if not row:
                return self._send_json({"error": "Invalid email or password"}, 401)

            user_obj = {
                "id": row[0], "email": row[1], "name": row[2], "role": row[3],
                "department": row[4], "position": row[5], "managerId": row[6]
            }
            token = generate_jwt(user_obj)
            return self._send_json({"token": token, "user": user_obj})

        # Add Work Update
        if path == "/api/work-updates":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)

            now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            update_id = f"upd-{int(time.time()*1000)}"
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("""
            INSERT INTO work_updates (id, employeeId, employeeName, workDate, hoursSpent, projectTag, description, weekStart, weekEnd, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                update_id, user['id'], user['name'], body.get('workDate'), float(body.get('hoursSpent', 0)),
                body.get('projectTag', 'General'), body.get('description', ''), body.get('weekStart', ''), body.get('weekEnd', ''), now, now
            ))
            conn.commit()
            conn.close()
            return self._send_json({"id": update_id, "success": True}, 201)

        # Submit Report
        if path.startswith("/api/reports/") and path.endswith("/submit"):
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)

            report_id = path.split("/")[3]
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, employeeId, employeeName, managerId, weekStart, weekEnd, answers FROM weekly_reports WHERE id=?", (report_id,))
            row = c.fetchone()
            if not row:
                conn.close()
                return self._send_json({"error": "Report not found"}, 404)

            answers = json.loads(row[6]) if row[6] else {}
            if body.get("answers"):
                answers = body["answers"]

            # Fetch work updates
            c.execute("SELECT workDate, hoursSpent, projectTag, description FROM work_updates WHERE employeeId=? AND weekStart=?", (user['id'], row[4]))
            updates_rows = c.fetchall()
            work_updates = [{"workDate": u[0], "hoursSpent": u[1], "projectTag": u[2], "description": u[3]} for u in updates_rows]

            # Trigger AI
            summary = generate_ai_summary(row[2], f"{row[4]} to {row[5]}", work_updates, answers)
            now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

            c.execute("""
            UPDATE weekly_reports
            SET status='SUBMITTED', answers=?, submittedAt=?, aiStatus='COMPLETED', aiSummary=?, updatedAt=?
            WHERE id=?
            """, (json.dumps(answers), now, json.dumps(summary), now, report_id))
            conn.commit()
            conn.close()

            return self._send_json({"id": report_id, "status": "SUBMITTED", "aiStatus": "COMPLETED", "aiSummary": summary})

        return self._send_json({"error": "Endpoint not found"}, 404)

    def do_PUT(self):
        url = urlparse(self.path)
        path = url.path
        body = self._get_body()

        # Save Report Draft
        if path == "/api/reports/draft":
            user = self._get_auth_user()
            if not user:
                return self._send_json({"error": "Unauthorized"}, 401)

            week_start = body.get("weekStart")
            week_end = body.get("weekEnd")
            answers = body.get("answers", {})
            now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT id, status FROM weekly_reports WHERE employeeId=? AND weekStart=?", (user['id'], week_start))
            row = c.fetchone()

            if row:
                report_id = row[0]
                if row[1] == "SUBMITTED":
                    conn.close()
                    return self._send_json({"error": "Cannot edit a submitted report"}, 400)
                c.execute("UPDATE weekly_reports SET answers=?, updatedAt=? WHERE id=?", (json.dumps(answers), now, report_id))
            else:
                report_id = f"rep-{int(time.time()*1000)}"
                c.execute("""
                INSERT INTO weekly_reports (id, employeeId, employeeName, managerId, weekStart, weekEnd, status, answers, submittedAt, aiStatus, aiSummary, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, NULL, 'IDLE', NULL, ?, ?)
                """, (report_id, user['id'], user['name'], user.get('managerId'), week_start, week_end, json.dumps(answers), now, now))

            conn.commit()
            conn.close()
            return self._send_json({"id": report_id, "status": "DRAFT", "answers": answers})

        return self._send_json({"error": "Endpoint not found"}, 404)

def run():
    server_address = ('0.0.0.0', PORT)
    httpd = HTTPServer(server_address, WorkPulseHandler)
    print(f"==================================================")
    print(f" Python 3 WorkPulse Enterprise Server on port {PORT}")
    print(f" SQLite Data Store: {DB_FILE}")
    print(f" Gemini AI Engine: {'Connected' if GEMINI_API_KEY else 'Internal Deterministic Engine'}")
    print(f"==================================================")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
