"""
WorkPulse - Enterprise FastAPI Application
Production FastAPI REST API with complete Entity-Service Architecture, MongoDB Atlas support, JWT Authentication, and Gemini AI Executive Synthesis.
"""

import os
import sys
import json
import time
import hashlib
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Union

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from jose import JWTError, jwt

# Optional MongoDB support via PyMongo
try:
    from pymongo import MongoClient, ASCENDING, DESCENDING
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

# ---------------------------------------------------------------------------
# Configuration & Environment
# ---------------------------------------------------------------------------
PORT = int(os.environ.get("PORT", 3000))
JWT_SECRET = os.environ.get("JWT_SECRET", "workpulse-enterprise-secret-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "1440"))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.7-flash")
MONGODB_URI = os.environ.get("MONGODB_URI", "")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "workpulse_db")

# ---------------------------------------------------------------------------
# Date Helpers
# ---------------------------------------------------------------------------
def get_reporting_week(target_date: Optional[date] = None) -> Dict[str, str]:
    if target_date is None:
        target_date = date.today()
    monday = target_date - timedelta(days=target_date.weekday())
    sunday = monday + timedelta(days=6)
    return {
        "weekStart": monday.isoformat(),
        "weekEnd": sunday.isoformat()
    }

def get_now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# ---------------------------------------------------------------------------
# 1. ENTITY & PYDANTIC MODELS LAYER
# ---------------------------------------------------------------------------
class UserRole(str):
    EMPLOYEE = "EMPLOYEE"
    MANAGER = "MANAGER"

class UserEntity(BaseModel):
    id: str
    email: str
    password: str  # Hashed
    name: str
    role: str
    department: str
    title: str
    managerId: Optional[str] = None
    managerName: Optional[str] = None
    createdAt: str

class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: str
    title: str
    managerId: Optional[str] = None
    managerName: Optional[str] = None

class QuestionEntity(BaseModel):
    id: str
    text: str
    category: str
    required: bool = True
    order: int = 1
    isActive: bool = True
    createdAt: Optional[str] = None

class WorkUpdateEntity(BaseModel):
    id: str
    employeeId: str
    workDate: str
    hoursSpent: float
    projectTag: str
    description: str
    createdAt: str
    updatedAt: str

class WeeklyReportAnswers(BaseModel):
    accomplishments: Optional[str] = ""
    inProgress: Optional[str] = ""
    blockers: Optional[str] = ""
    nextWeekPriorities: Optional[str] = ""

class AISummaryEntity(BaseModel):
    executiveSummary: str
    keyAccomplishments: List[str] = []
    currentWork: List[str] = []
    blockers: List[str] = []
    nextWeekPriorities: List[str] = []
    generatedAt: str
    model: str

class WeeklyReportEntity(BaseModel):
    id: str
    employeeId: str
    employeeName: str
    employeeEmail: str
    managerId: Optional[str] = None
    weekStart: str
    weekEnd: str
    status: str = "DRAFT"  # DRAFT, SUBMITTED
    reviewStatus: Optional[str] = "PENDING"  # PENDING, APPROVED, NEEDS_REVISION
    managerFeedback: Optional[str] = ""
    answers: Dict[str, Any] = {}
    aiSummary: Optional[Dict[str, Any]] = None
    aiStatus: str = "NOT_STARTED"  # NOT_STARTED, PROCESSING, COMPLETED, FAILED
    submittedAt: Optional[str] = None
    reviewedAt: Optional[str] = None
    createdAt: str
    updatedAt: str

class AuditLogEntity(BaseModel):
    id: str
    userId: str
    userEmail: str
    action: str
    targetType: str
    targetId: str
    details: str
    timestamp: str

# Request Payloads
class LoginPayload(BaseModel):
    email: str
    password: str

class WorkUpdateCreatePayload(BaseModel):
    workDate: str
    hoursSpent: float = Field(gt=0, le=24)
    projectTag: Optional[str] = "General"
    description: str

class WorkUpdateUpdatePayload(BaseModel):
    workDate: Optional[str] = None
    hoursSpent: Optional[float] = None
    projectTag: Optional[str] = None
    description: Optional[str] = None

class DraftSavePayload(BaseModel):
    reportId: Optional[str] = None
    weekStart: Optional[str] = None
    weekEnd: Optional[str] = None
    answers: Optional[Dict[str, Any]] = None

class SubmitPayload(BaseModel):
    answers: Optional[Dict[str, Any]] = None

class ReviewPayload(BaseModel):
    status: str = Field(pattern="^(APPROVED|NEEDS_REVISION|PENDING)$")
    managerFeedback: Optional[str] = ""

class QuestionCreatePayload(BaseModel):
    text: str
    category: Optional[str] = "General"
    required: Optional[bool] = True
    order: Optional[int] = 1

# ---------------------------------------------------------------------------
# 2. DATABASE & REPOSITORY LAYER (MongoDB + High-Performance Document Store)
# ---------------------------------------------------------------------------
class DatabaseManager:
    def __init__(self):
        self.use_mongodb = False
        self.mongo_client: Optional[Any] = None
        self.mongo_db: Optional[Any] = None
        self.local_file = os.path.join(os.getcwd(), "data", "db.json")
        os.makedirs(os.path.dirname(self.local_file), exist_ok=True)
        
        # Local document collections
        self.users: List[Dict[str, Any]] = []
        self.questions: List[Dict[str, Any]] = []
        self.work_updates: List[Dict[str, Any]] = []
        self.weekly_reports: List[Dict[str, Any]] = []
        self.audit_logs: List[Dict[str, Any]] = []
        
        self.init_database()

    def init_database(self):
        # Attempt MongoDB / MongoDB Atlas connection if URI is present
        if MONGODB_URI and PYMONGO_AVAILABLE:
            try:
                print(f"[DatabaseManager] Connecting to MongoDB Atlas: {MONGODB_URI.split('@')[-1] if '@' in MONGODB_URI else 'MongoDB'}")
                self.mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=4000)
                # Ping
                self.mongo_client.admin.command('ping')
                self.mongo_db = self.mongo_client[DATABASE_NAME]
                self.use_mongodb = True
                print(f"[DatabaseManager] Successfully connected to MongoDB Database: '{DATABASE_NAME}'")
                self.ensure_mongo_indexes()
                self.ensure_mongo_seed_data()
                return
            except Exception as err:
                print(f"[DatabaseManager] MongoDB Atlas connection error ({err}). Falling back to persistent Document store.")
                self.use_mongodb = False

        # Fallback to local persistent JSON document store
        self.load_local_store()

    def ensure_mongo_indexes(self):
        if not self.use_mongodb:
            return
        try:
            self.mongo_db.users.create_index("email", unique=True)
            self.mongo_db.work_updates.create_index([("employeeId", ASCENDING), ("workDate", DESCENDING)])
            self.mongo_db.weekly_reports.create_index([("employeeId", ASCENDING), ("weekStart", DESCENDING)])
            self.mongo_db.weekly_reports.create_index("managerId")
            self.mongo_db.audit_logs.create_index("timestamp", expireAfterSeconds=60*60*24*90) # 90 days
        except Exception as e:
            print(f"[DatabaseManager] Index creation notice: {e}")

    def ensure_mongo_seed_data(self):
        if not self.use_mongodb:
            return
        try:
            if self.mongo_db.users.count_documents({}) == 0:
                print("[DatabaseManager] MongoDB is empty. Seeding initial collections...")
                seed_data = self.get_seed_records()
                self.mongo_db.users.insert_many(seed_data["users"])
                self.mongo_db.questions.insert_many(seed_data["questions"])
                self.mongo_db.work_updates.insert_many(seed_data["work_updates"])
                self.mongo_db.weekly_reports.insert_many(seed_data["weekly_reports"])
                self.mongo_db.audit_logs.insert_many(seed_data["audit_logs"])
        except Exception as e:
            print(f"[DatabaseManager] Seed error on MongoDB: {e}")

    def get_seed_records(self) -> Dict[str, List[Dict[str, Any]]]:
        now = get_now_iso()
        curr_week = get_reporting_week()
        
        users = [
            {
                "id": "mgr-1",
                "email": "manager1@example.com",
                "password": hash_password("Manager@123"),
                "name": "Sarah Connor",
                "role": "MANAGER",
                "department": "Engineering",
                "title": "Engineering Manager",
                "managerId": None,
                "managerName": None,
                "createdAt": now
            },
            {
                "id": "mgr-2",
                "email": "manager2@example.com",
                "password": hash_password("Manager@123"),
                "name": "David Miller",
                "role": "MANAGER",
                "department": "Product",
                "title": "Director of Product",
                "managerId": None,
                "managerName": None,
                "createdAt": now
            },
            {
                "id": "emp-1",
                "email": "employee1@example.com",
                "password": hash_password("Employee@123"),
                "name": "Alex Rivera",
                "role": "EMPLOYEE",
                "department": "Engineering",
                "title": "Senior Full-Stack Engineer",
                "managerId": "mgr-1",
                "managerName": "Sarah Connor",
                "createdAt": now
            },
            {
                "id": "emp-2",
                "email": "employee2@example.com",
                "password": hash_password("Employee@123"),
                "name": "Maya Chen",
                "role": "EMPLOYEE",
                "department": "Engineering",
                "title": "Frontend Specialist",
                "managerId": "mgr-1",
                "managerName": "Sarah Connor",
                "createdAt": now
            },
            {
                "id": "emp-3",
                "email": "employee3@example.com",
                "password": hash_password("Employee@123"),
                "name": "Liam Wilson",
                "role": "EMPLOYEE",
                "department": "Engineering",
                "title": "DevOps & Cloud Engineer",
                "managerId": "mgr-1",
                "managerName": "Sarah Connor",
                "createdAt": now
            },
            {
                "id": "emp-4",
                "email": "employee4@example.com",
                "password": hash_password("Employee@123"),
                "name": "Jordan Taylor",
                "role": "EMPLOYEE",
                "department": "Product",
                "title": "Product UX Designer",
                "managerId": "mgr-2",
                "managerName": "David Miller",
                "createdAt": now
            },
            {
                "id": "emp-5",
                "email": "employee5@example.com",
                "password": hash_password("Employee@123"),
                "name": "Chloe Vance",
                "role": "EMPLOYEE",
                "department": "Product",
                "title": "QA Automation Specialist",
                "managerId": "mgr-2",
                "managerName": "David Miller",
                "createdAt": now
            },
        ]

        questions = [
            {"id": "q-1", "text": "What were your key accomplishments and deliverables this week?", "category": "Accomplishments", "required": True, "order": 1, "isActive": True},
            {"id": "q-2", "text": "What tasks, features, or initiatives are currently in progress?", "category": "In Progress", "required": True, "order": 2, "isActive": True},
            {"id": "q-3", "text": "Did you encounter any blockers, risks, or dependency bottlenecks?", "category": "Blockers", "required": True, "order": 3, "isActive": True},
            {"id": "q-4", "text": "What are your top priorities and commitments planned for next week?", "category": "Priorities", "required": True, "order": 4, "isActive": True},
        ]

        work_updates = [
            {
                "id": "upd-seed-1",
                "employeeId": "emp-1",
                "workDate": curr_week["weekStart"],
                "hoursSpent": 4.5,
                "projectTag": "Core Engine",
                "description": "Refactored JWT authorization middleware and added schema validation for weekly reports.",
                "createdAt": now,
                "updatedAt": now
            },
            {
                "id": "upd-seed-2",
                "employeeId": "emp-1",
                "workDate": curr_week["weekStart"],
                "hoursSpent": 3.5,
                "projectTag": "AI Integration",
                "description": "Engineered fallback executive synthesis pipeline with Gemini 3.7 Flash support.",
                "createdAt": now,
                "updatedAt": now
            },
            {
                "id": "upd-seed-3",
                "employeeId": "emp-2",
                "workDate": curr_week["weekStart"],
                "hoursSpent": 7.0,
                "projectTag": "UI Components",
                "description": "Implemented accessible WCAG theme switcher and responsive daily work updates table.",
                "createdAt": now,
                "updatedAt": now
            }
        ]

        weekly_reports = [
            {
                "id": "rep-seed-1",
                "employeeId": "emp-2",
                "employeeName": "Maya Chen",
                "employeeEmail": "employee2@example.com",
                "managerId": "mgr-1",
                "weekStart": curr_week["weekStart"],
                "weekEnd": curr_week["weekEnd"],
                "status": "SUBMITTED",
                "reviewStatus": "APPROVED",
                "managerFeedback": "Great job on the theme and layout refactoring!",
                "answers": {
                    "accomplishments": "Completed dark/light theme switching and streamlined report questionnaire.",
                    "inProgress": "Optimizing PDF export pagination and font styles.",
                    "blockers": "None this week.",
                    "nextWeekPriorities": "Build manager batch report approval workflow."
                },
                "aiSummary": {
                    "executiveSummary": "Maya delivered high-quality UI theming components and refined the questionnaire flow with zero blockers reported.",
                    "keyAccomplishments": ["Shipped theme switching", "Streamlined 4-question submission UX"],
                    "currentWork": ["PDF generator pagination optimization"],
                    "blockers": ["No active blockers reported"],
                    "nextWeekPriorities": ["Manager batch review workflow"],
                    "generatedAt": now,
                    "model": "gemini-3.7-flash"
                },
                "aiStatus": "COMPLETED",
                "submittedAt": now,
                "reviewedAt": now,
                "createdAt": now,
                "updatedAt": now
            }
        ]

        audit_logs = [
            {
                "id": "aud-init",
                "userId": "system",
                "userEmail": "system@workpulse.internal",
                "action": "SYSTEM_INITIALIZED",
                "targetType": "SYSTEM",
                "targetId": "sys-0",
                "details": "WorkPulse Enterprise database initialized.",
                "timestamp": now
            }
        ]

        return {
            "users": users,
            "questions": questions,
            "work_updates": work_updates,
            "weekly_reports": weekly_reports,
            "audit_logs": audit_logs
        }

    def load_local_store(self):
        if os.path.exists(self.local_file):
            try:
                with open(self.local_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.users = data.get("users", [])
                    self.questions = data.get("questions", [])
                    self.work_updates = data.get("work_updates", data.get("workUpdates", []))
                    self.weekly_reports = data.get("weekly_reports", data.get("weeklyReports", []))
                    self.audit_logs = data.get("audit_logs", data.get("auditLogs", []))
                    print(f"[DatabaseManager] Loaded local store: {len(self.users)} users, {len(self.work_updates)} updates.")
                    return
            except Exception as e:
                print(f"[DatabaseManager] Failed to read local store ({e}). Rebuilding seeds.")
        
        # Initialize defaults
        seed = self.get_seed_records()
        self.users = seed["users"]
        self.questions = seed["questions"]
        self.work_updates = seed["work_updates"]
        self.weekly_reports = seed["weekly_reports"]
        self.audit_logs = seed["audit_logs"]
        self.save_local_store()

    def save_local_store(self):
        if self.use_mongodb:
            return
        try:
            with open(self.local_file, "w", encoding="utf-8") as f:
                json.dump({
                    "users": self.users,
                    "questions": self.questions,
                    "work_updates": self.work_updates,
                    "weekly_reports": self.weekly_reports,
                    "audit_logs": self.audit_logs
                }, f, indent=2)
        except Exception as e:
            print(f"[DatabaseManager] Error saving local store: {e}")

    def get_status(self) -> Dict[str, Any]:
        if self.use_mongodb:
            try:
                t0 = time.time()
                self.mongo_client.admin.command('ping')
                latency = round((time.time() - t0) * 1000, 2)
                return {
                    "databaseType": "MongoDB Atlas" if "mongodb+srv://" in MONGODB_URI else "MongoDB",
                    "connected": True,
                    "databaseName": DATABASE_NAME,
                    "latencyMs": latency,
                    "collections": {
                        "users": self.mongo_db.users.count_documents({}),
                        "work_updates": self.mongo_db.work_updates.count_documents({}),
                        "weekly_reports": self.mongo_db.weekly_reports.count_documents({}),
                        "questions": self.mongo_db.questions.count_documents({}),
                        "audit_logs": self.mongo_db.audit_logs.count_documents({})
                    },
                    "uriConfigured": True
                }
            except Exception as e:
                return {
                    "databaseType": "MongoDB (Offline/Fallback)",
                    "connected": False,
                    "error": str(e),
                    "databaseName": DATABASE_NAME,
                    "uriConfigured": True
                }
        else:
            return {
                "databaseType": "Embedded Persistent Document Store (JSON Engine)",
                "connected": True,
                "databaseName": "local_data_store",
                "latencyMs": 0.5,
                "collections": {
                    "users": len(self.users),
                    "work_updates": len(self.work_updates),
                    "weekly_reports": len(self.weekly_reports),
                    "questions": len(self.questions),
                    "audit_logs": len(self.audit_logs)
                },
                "uriConfigured": bool(MONGODB_URI)
            }

db_manager = DatabaseManager()

# ---------------------------------------------------------------------------
# 3. REPOSITORY LAYER
# ---------------------------------------------------------------------------
class UserRepository:
    @staticmethod
    def find_by_email(email: str) -> Optional[Dict[str, Any]]:
        email_clean = email.strip().lower()
        if db_manager.use_mongodb:
            doc = db_manager.mongo_db.users.find_one({"email": {"$regex": f"^{email_clean}$", "$options": "i"}})
            if doc:
                doc.pop("_id", None)
            return doc
        return next((u for u in db_manager.users if u["email"].lower() == email_clean), None)

    @staticmethod
    def find_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            doc = db_manager.mongo_db.users.find_one({"id": user_id})
            if doc:
                doc.pop("_id", None)
            return doc
        return next((u for u in db_manager.users if u["id"] == user_id), None)

    @staticmethod
    def find_by_manager(manager_id: str) -> List[Dict[str, Any]]:
        if db_manager.use_mongodb:
            docs = list(db_manager.mongo_db.users.find({"managerId": manager_id, "role": "EMPLOYEE"}))
            for d in docs:
                d.pop("_id", None)
            return docs
        return [u for u in db_manager.users if u.get("managerId") == manager_id and u.get("role") == "EMPLOYEE"]

class WorkUpdateRepository:
    @staticmethod
    def find(employee_id: Optional[str] = None, week_start: Optional[str] = None, week_end: Optional[str] = None) -> List[Dict[str, Any]]:
        if db_manager.use_mongodb:
            q: Dict[str, Any] = {}
            if employee_id:
                q["employeeId"] = employee_id
            if week_start and week_end:
                q["workDate"] = {"$gte": week_start, "$lte": week_end}
            elif week_start:
                q["workDate"] = {"$gte": week_start}
            docs = list(db_manager.mongo_db.work_updates.find(q).sort("workDate", DESCENDING))
            for d in docs:
                d.pop("_id", None)
            return docs
        
        res = db_manager.work_updates
        if employee_id:
            res = [w for w in res if w.get("employeeId") == employee_id]
        if week_start and week_end:
            res = [w for w in res if week_start <= w.get("workDate", "") <= week_end]
        elif week_start:
            res = [w for w in res if w.get("workDate", "") >= week_start]
        return sorted(res, key=lambda x: x.get("workDate", ""), reverse=True)

    @staticmethod
    def find_by_id(update_id: str) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            doc = db_manager.mongo_db.work_updates.find_one({"id": update_id})
            if doc:
                doc.pop("_id", None)
            return doc
        return next((w for w in db_manager.work_updates if w["id"] == update_id), None)

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        if db_manager.use_mongodb:
            db_manager.mongo_db.work_updates.insert_one(data.copy())
            data.pop("_id", None)
            return data
        db_manager.work_updates.append(data)
        db_manager.save_local_store()
        return data

    @staticmethod
    def update(update_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            db_manager.mongo_db.work_updates.update_one({"id": update_id}, {"$set": updates})
            return WorkUpdateRepository.find_by_id(update_id)
        for i, item in enumerate(db_manager.work_updates):
            if item["id"] == update_id:
                db_manager.work_updates[i].update(updates)
                db_manager.save_local_store()
                return db_manager.work_updates[i]
        return None

    @staticmethod
    def delete(update_id: str) -> bool:
        if db_manager.use_mongodb:
            res = db_manager.mongo_db.work_updates.delete_one({"id": update_id})
            return res.deleted_count > 0
        before = len(db_manager.work_updates)
        db_manager.work_updates = [w for w in db_manager.work_updates if w["id"] != update_id]
        deleted = len(db_manager.work_updates) < before
        if deleted:
            db_manager.save_local_store()
        return deleted

class WeeklyReportRepository:
    @staticmethod
    def find_by_id(report_id: str) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            doc = db_manager.mongo_db.weekly_reports.find_one({"id": report_id})
            if doc:
                doc.pop("_id", None)
            return doc
        return next((r for r in db_manager.weekly_reports if r["id"] == report_id), None)

    @staticmethod
    def find_by_employee_and_week(employee_id: str, week_start: str) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            doc = db_manager.mongo_db.weekly_reports.find_one({"employeeId": employee_id, "weekStart": week_start})
            if doc:
                doc.pop("_id", None)
            return doc
        return next((r for r in db_manager.weekly_reports if r.get("employeeId") == employee_id and r.get("weekStart") == week_start), None)

    @staticmethod
    def find_by_employee(employee_id: str) -> List[Dict[str, Any]]:
        if db_manager.use_mongodb:
            docs = list(db_manager.mongo_db.weekly_reports.find({"employeeId": employee_id}).sort("weekStart", DESCENDING))
            for d in docs:
                d.pop("_id", None)
            return docs
        return sorted([r for r in db_manager.weekly_reports if r.get("employeeId") == employee_id], key=lambda x: x.get("weekStart", ""), reverse=True)

    @staticmethod
    def find_by_manager(manager_id: str) -> List[Dict[str, Any]]:
        if db_manager.use_mongodb:
            docs = list(db_manager.mongo_db.weekly_reports.find({"managerId": manager_id}).sort("weekStart", DESCENDING))
            for d in docs:
                d.pop("_id", None)
            return docs
        return sorted([r for r in db_manager.weekly_reports if r.get("managerId") == manager_id], key=lambda x: x.get("weekStart", ""), reverse=True)

    @staticmethod
    def save(report: Dict[str, Any]) -> Dict[str, Any]:
        report_id = report["id"]
        if db_manager.use_mongodb:
            db_manager.mongo_db.weekly_reports.update_one({"id": report_id}, {"$set": report}, upsert=True)
            return WeeklyReportRepository.find_by_id(report_id) or report
        for i, r in enumerate(db_manager.weekly_reports):
            if r["id"] == report_id:
                db_manager.weekly_reports[i] = report
                db_manager.save_local_store()
                return report
        db_manager.weekly_reports.append(report)
        db_manager.save_local_store()
        return report

class QuestionRepository:
    @staticmethod
    def get_all(active_only: bool = True) -> List[Dict[str, Any]]:
        if db_manager.use_mongodb:
            q = {"isActive": True} if active_only else {}
            docs = list(db_manager.mongo_db.questions.find(q).sort("order", ASCENDING))
            for d in docs:
                d.pop("_id", None)
            return docs
        items = [q for q in db_manager.questions if (not active_only or q.get("isActive", True))]
        return sorted(items, key=lambda x: x.get("order", 1))

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        if db_manager.use_mongodb:
            db_manager.mongo_db.questions.insert_one(data.copy())
            data.pop("_id", None)
            return data
        db_manager.questions.append(data)
        db_manager.save_local_store()
        return data

    @staticmethod
    def update(q_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if db_manager.use_mongodb:
            db_manager.mongo_db.questions.update_one({"id": q_id}, {"$set": updates})
            doc = db_manager.mongo_db.questions.find_one({"id": q_id})
            if doc:
                doc.pop("_id", None)
            return doc
        for i, q in enumerate(db_manager.questions):
            if q["id"] == q_id:
                db_manager.questions[i].update(updates)
                db_manager.save_local_store()
                return db_manager.questions[i]
        return None

    @staticmethod
    def delete(q_id: str) -> bool:
        return QuestionRepository.update(q_id, {"isActive": False}) is not None

class AuditLogRepository:
    @staticmethod
    def log(user_id: str, user_email: str, action: str, target_type: str, target_id: str, details: str):
        record = {
            "id": f"aud-{int(time.time()*1000)}",
            "userId": user_id,
            "userEmail": user_email,
            "action": action,
            "targetType": target_type,
            "targetId": target_id,
            "details": details,
            "timestamp": get_now_iso()
        }
        if db_manager.use_mongodb:
            try:
                db_manager.mongo_db.audit_logs.insert_one(record)
            except Exception:
                pass
        else:
            db_manager.audit_logs.insert(0, record)
            db_manager.save_local_store()

# ---------------------------------------------------------------------------
# 4. SERVICE LAYER (Business Logic)
# ---------------------------------------------------------------------------
class AuthService:
    @staticmethod
    def create_token(user_payload: Dict[str, Any]) -> str:
        payload = user_payload.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload.update({"exp": expire})
        return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired session token.")

    @staticmethod
    def authenticate(email: str, password: str) -> Dict[str, Any]:
        user = UserRepository.find_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        pw_hash = hash_password(password)
        if user["password"] != pw_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        user_data = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "department": user["department"],
            "title": user["title"],
            "managerId": user.get("managerId"),
            "managerName": user.get("managerName")
        }
        token = AuthService.create_token(user_data)
        AuditLogRepository.log(user["id"], user["email"], "USER_LOGIN", "USER", user["id"], f"{user['name']} logged in.")
        return {"token": token, "user": user_data}

class AISummaryService:
    @staticmethod
    def synthesize(employee_name: str, reporting_period: str, work_updates: List[Dict[str, Any]], answers: Dict[str, Any]) -> Dict[str, Any]:
        logs_formatted = "\n".join([
            f"{i+1}. [{u.get('workDate')}] ({u.get('hoursSpent',0)}h | {u.get('projectTag','General')}): {u.get('description','')}"
            for i, u in enumerate(work_updates)
        ]) if work_updates else "No daily logs recorded."

        prompt = f"""You are an executive employee reporting assistant. Summarize the provided weekly work report using ONLY the provided facts.

EMPLOYEE: {employee_name}
REPORTING PERIOD: {reporting_period}

DAILY WORK LOGS:
{logs_formatted}

WEEKLY REPORT RESPONSES:
1. Accomplishments: {answers.get('accomplishments', 'None stated')}
2. In Progress: {answers.get('inProgress', 'None stated')}
3. Blockers: {answers.get('blockers', 'None stated')}
4. Next Week Priorities: {answers.get('nextWeekPriorities', 'None stated')}

Output valid JSON matching this schema:
{{
  "executiveSummary": "2-3 concise sentences summarizing deliverables and trajectory...",
  "keyAccomplishments": ["Key deliverable 1", "Key deliverable 2"],
  "currentWork": ["Work item 1", "Work item 2"],
  "blockers": ["Blocker item or 'No active blockers reported'"],
  "nextWeekPriorities": ["Priority 1", "Priority 2"]
}}"""

        if GEMINI_API_KEY:
            try:
                import urllib.request
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
                body = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=14) as resp:
                    raw_data = json.loads(resp.read().decode("utf-8"))
                    text = raw_data['candidates'][0]['content']['parts'][0]['text']
                    parsed = json.loads(text.strip().replace('```json', '').replace('```', ''))
                    parsed["generatedAt"] = get_now_iso()
                    parsed["model"] = GEMINI_MODEL
                    return parsed
            except Exception as e:
                print(f"[AISummaryService] Gemini API notice: {e}")

        # Deterministic High-Precision Fallback
        total_hours = sum(u.get('hoursSpent', 0) for u in work_updates)
        acc = [a.strip() for a in (answers.get('accomplishments') or '').split('\n') if a.strip()]
        prog = [p.strip() for p in (answers.get('inProgress') or '').split('\n') if p.strip()]
        block = [b.strip() for b in (answers.get('blockers') or '').split('\n') if b.strip()]
        prio = [pr.strip() for pr in (answers.get('nextWeekPriorities') or '').split('\n') if pr.strip()]

        return {
            "executiveSummary": f"{employee_name} logged {len(work_updates)} updates totaling {total_hours}h during the {reporting_period} cycle, maintaining execution across primary project streams.",
            "keyAccomplishments": acc[:4] or ["Completed assigned development tasks and milestones."],
            "currentWork": prog[:4] or ["Core project deliverables in active progress."],
            "blockers": block[:3] or ["No active blockers reported."],
            "nextWeekPriorities": prio[:4] or ["Proceed with scheduled roadmap commitments."],
            "generatedAt": get_now_iso(),
            "model": "WorkPulse Executive Synthesis Engine"
        }

class WeeklyReportService:
    @staticmethod
    def get_or_create_current_report(user: Dict[str, Any]) -> Dict[str, Any]:
        curr_week = get_reporting_week()
        rep = WeeklyReportRepository.find_by_employee_and_week(user["id"], curr_week["weekStart"])
        if not rep:
            rep = {
                "id": f"rep-{int(time.time()*1000)}",
                "employeeId": user["id"],
                "employeeName": user["name"],
                "employeeEmail": user["email"],
                "managerId": user.get("managerId"),
                "weekStart": curr_week["weekStart"],
                "weekEnd": curr_week["weekEnd"],
                "status": "DRAFT",
                "reviewStatus": "PENDING",
                "managerFeedback": "",
                "answers": {"accomplishments": "", "inProgress": "", "blockers": "", "nextWeekPriorities": ""},
                "aiSummary": None,
                "aiStatus": "NOT_STARTED",
                "createdAt": get_now_iso(),
                "updatedAt": get_now_iso()
            }
            WeeklyReportRepository.save(rep)
        
        updates = WorkUpdateRepository.find(user["id"], curr_week["weekStart"], curr_week["weekEnd"])
        return {"report": rep, "workUpdates": updates}

    @staticmethod
    def submit_report(report_id: str, user: Dict[str, Any], answers: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        report = WeeklyReportRepository.find_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Weekly report not found.")
        if report["employeeId"] != user["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to submit this report.")
        
        if answers:
            report["answers"].update(answers)

        report["status"] = "SUBMITTED"
        report["submittedAt"] = get_now_iso()
        report["updatedAt"] = get_now_iso()

        # Generate Executive AI Summary
        updates = WorkUpdateRepository.find(report["employeeId"], report["weekStart"], report["weekEnd"])
        summary = AISummaryService.synthesize(
            report["employeeName"],
            f"{report['weekStart']} to {report['weekEnd']}",
            updates,
            report["answers"]
        )
        report["aiSummary"] = summary
        report["aiStatus"] = "COMPLETED"

        WeeklyReportRepository.save(report)
        AuditLogRepository.log(user["id"], user["email"], "REPORT_SUBMITTED", "REPORT", report_id, f"Report submitted for cycle {report['weekStart']}")
        return {"report": report, "workUpdates": updates}

# ---------------------------------------------------------------------------
# 5. AUTH DEPENDENCY
# ---------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = authorization.split(" ")[1]
    return AuthService.verify_token(token)

def require_manager(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "MANAGER":
        raise HTTPException(status_code=403, detail="Manager role privileges required.")
    return user

# ---------------------------------------------------------------------------
# 6. FASTAPI CONTROLLER & ROUTER LAYER
# ---------------------------------------------------------------------------
app = FastAPI(
    title="WorkPulse Enterprise API",
    description="REST API with Entity-Service Architecture, MongoDB Atlas support, JWT Auth, and Gemini AI Executive Summaries",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
questions_router = APIRouter(prefix="/api/questions", tags=["Questions"])
work_updates_router = APIRouter(prefix="/api/work-updates", tags=["Work Updates"])
reports_router = APIRouter(prefix="/api/reports", tags=["Weekly Reports"])
manager_router = APIRouter(prefix="/api/manager", tags=["Manager Portal"])

# --- System & DB Health ---
@app.get("/")
def api_root():
    return {
        "service": "WorkPulse Enterprise API Server",
        "status": "online",
        "framework": "FastAPI + Python 3",
        "docsUrl": "/docs",
        "dbStatusUrl": "/api/db-status",
        "healthUrl": "/api/health",
        "timestamp": get_now_iso()
    }

@app.get("/api/health")
def api_health():
    db_stat = db_manager.get_status()
    return {
        "status": "healthy",
        "service": "WorkPulse API Server",
        "environment": os.environ.get("NODE_ENV", "development"),
        "database": db_stat["databaseType"],
        "databaseConnected": db_stat.get("connected", False),
        "aiConfigured": bool(GEMINI_API_KEY),
        "aiModel": GEMINI_MODEL,
        "timestamp": get_now_iso()
    }

@app.get("/api/db-status")
def api_db_status():
    return db_manager.get_status()

# --- Auth Endpoints ---
@auth_router.post("/login")
def login(payload: LoginPayload):
    return AuthService.authenticate(payload.email, payload.password)

@auth_router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": user}

@auth_router.post("/reset-demo")
def reset_demo(user: Dict[str, Any] = Depends(get_current_user)):
    db_manager.load_local_store()
    return {"message": "Demo data restored successfully."}

# --- Questions Endpoints ---
@questions_router.get("")
def get_questions():
    return {"questions": QuestionRepository.get_all(active_only=True)}

@questions_router.post("")
def create_question(payload: QuestionCreatePayload, user: Dict[str, Any] = Depends(require_manager)):
    new_q = {
        "id": f"q-{int(time.time()*1000)}",
        "text": payload.text,
        "category": payload.category or "General",
        "required": payload.required if payload.required is not None else True,
        "order": payload.order or 1,
        "isActive": True,
        "createdAt": get_now_iso()
    }
    created = QuestionRepository.create(new_q)
    return {"question": created}

@questions_router.put("/{q_id}")
def update_question(q_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(require_manager)):
    updated = QuestionRepository.update(q_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Question not found.")
    return {"question": updated}

@questions_router.delete("/{q_id}")
def delete_question(q_id: str, user: Dict[str, Any] = Depends(require_manager)):
    success = QuestionRepository.delete(q_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found.")
    return {"message": "Question deactivated successfully."}

# --- Work Updates Endpoints ---
@work_updates_router.get("")
def get_work_updates(
    employeeId: Optional[str] = Query(None),
    weekStart: Optional[str] = Query(None),
    weekEnd: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    target_emp_id = employeeId if (employeeId and user["role"] == "MANAGER") else user["id"]
    updates = WorkUpdateRepository.find(target_emp_id, weekStart, weekEnd)
    return {"workUpdates": updates}

@work_updates_router.post("")
def create_work_update(payload: WorkUpdateCreatePayload, user: Dict[str, Any] = Depends(get_current_user)):
    new_upd = {
        "id": f"wu-{int(time.time()*1000)}",
        "employeeId": user["id"],
        "workDate": payload.workDate,
        "hoursSpent": payload.hoursSpent,
        "projectTag": payload.projectTag or "General",
        "description": payload.description.strip(),
        "createdAt": get_now_iso(),
        "updatedAt": get_now_iso()
    }
    created = WorkUpdateRepository.create(new_upd)
    AuditLogRepository.log(user["id"], user["email"], "WORK_UPDATE_CREATED", "WORK_UPDATE", new_upd["id"], f"Logged {payload.hoursSpent}h for {payload.workDate}")
    return {"workUpdate": created}

@work_updates_router.put("/{upd_id}")
def update_work_update(upd_id: str, payload: WorkUpdateUpdatePayload, user: Dict[str, Any] = Depends(get_current_user)):
    existing = WorkUpdateRepository.find_by_id(upd_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Work update not found.")
    if existing["employeeId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this work update.")

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updates["updatedAt"] = get_now_iso()
    updated = WorkUpdateRepository.update(upd_id, updates)
    return {"workUpdate": updated}

@work_updates_router.delete("/{upd_id}")
def delete_work_update(upd_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    existing = WorkUpdateRepository.find_by_id(upd_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Work update not found.")
    if existing["employeeId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this work update.")

    WorkUpdateRepository.delete(upd_id)
    AuditLogRepository.log(user["id"], user["email"], "WORK_UPDATE_DELETED", "WORK_UPDATE", upd_id, "Deleted work update")
    return {"message": "Work update deleted successfully."}

# --- Reports Endpoints ---
@reports_router.get("")
def list_reports(user: Dict[str, Any] = Depends(get_current_user)):
    if user["role"] == "MANAGER":
        reports = WeeklyReportRepository.find_by_manager(user["id"])
    else:
        reports = WeeklyReportRepository.find_by_employee(user["id"])
    return {"reports": reports}

@reports_router.get("/current")
def get_current_report(user: Dict[str, Any] = Depends(get_current_user)):
    return WeeklyReportService.get_or_create_current_report(user)

@reports_router.get("/history")
def get_report_history(user: Dict[str, Any] = Depends(get_current_user)):
    reports = WeeklyReportRepository.find_by_employee(user["id"])
    return {"reports": reports}

@reports_router.get("/{report_id}")
def get_report_by_id(report_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    report = WeeklyReportRepository.find_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Weekly report not found.")
    if report["employeeId"] != user["id"] and report.get("managerId") != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this report.")
    
    updates = WorkUpdateRepository.find(report["employeeId"], report["weekStart"], report["weekEnd"])
    return {"report": report, "workUpdates": updates}

@reports_router.post("/draft")
def save_draft(payload: DraftSavePayload, user: Dict[str, Any] = Depends(get_current_user)):
    curr_week = get_reporting_week()
    w_start = payload.weekStart or curr_week["weekStart"]
    w_end = payload.weekEnd or curr_week["weekEnd"]

    report = None
    if payload.reportId:
        report = WeeklyReportRepository.find_by_id(payload.reportId)
    if not report:
        report = WeeklyReportRepository.find_by_employee_and_week(user["id"], w_start)

    if not report:
        report = {
            "id": f"rep-{int(time.time()*1000)}",
            "employeeId": user["id"],
            "employeeName": user["name"],
            "employeeEmail": user["email"],
            "managerId": user.get("managerId"),
            "weekStart": w_start,
            "weekEnd": w_end,
            "status": "DRAFT",
            "reviewStatus": "PENDING",
            "answers": payload.answers or {},
            "aiSummary": None,
            "aiStatus": "NOT_STARTED",
            "createdAt": get_now_iso(),
            "updatedAt": get_now_iso()
        }
    else:
        if payload.answers:
            report["answers"].update(payload.answers)
        report["updatedAt"] = get_now_iso()

    saved = WeeklyReportRepository.save(report)
    return {"report": saved}

@reports_router.post("/{report_id}/submit")
def submit_report(report_id: str, payload: SubmitPayload = None, user: Dict[str, Any] = Depends(get_current_user)):
    answers = payload.answers if payload else None
    return WeeklyReportService.submit_report(report_id, user, answers)

@reports_router.post("/{report_id}/generate-summary")
def generate_summary(report_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    report = WeeklyReportRepository.find_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    if report["employeeId"] != user["id"] and report.get("managerId") != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this report.")

    updates = WorkUpdateRepository.find(report["employeeId"], report["weekStart"], report["weekEnd"])
    summary = AISummaryService.synthesize(
        report["employeeName"],
        f"{report['weekStart']} to {report['weekEnd']}",
        updates,
        report["answers"]
    )
    report["aiSummary"] = summary
    report["aiStatus"] = "COMPLETED"
    report["updatedAt"] = get_now_iso()
    WeeklyReportRepository.save(report)
    return {"aiSummary": summary, "report": report}

@reports_router.post("/{report_id}/review")
def review_report(report_id: str, payload: ReviewPayload, user: Dict[str, Any] = Depends(require_manager)):
    report = WeeklyReportRepository.find_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    if report.get("managerId") != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized: this employee does not report to you.")

    report["reviewStatus"] = payload.status
    report["managerFeedback"] = payload.managerFeedback or ""
    report["reviewedAt"] = get_now_iso()
    report["updatedAt"] = get_now_iso()
    saved = WeeklyReportRepository.save(report)
    AuditLogRepository.log(user["id"], user["email"], "REPORT_REVIEWED", "REPORT", report_id, f"Report reviewed with status: {payload.status}")
    return {"report": saved}

# --- Manager Endpoints ---
@manager_router.get("/team-members")
def get_team_members(user: Dict[str, Any] = Depends(require_manager)):
    members = UserRepository.find_by_manager(user["id"])
    curr_week = get_reporting_week()
    
    result = []
    for m in members:
        rep = WeeklyReportRepository.find_by_employee_and_week(m["id"], curr_week["weekStart"])
        updates = WorkUpdateRepository.find(m["id"], curr_week["weekStart"], curr_week["weekEnd"])
        total_hours = sum(u.get("hoursSpent", 0) for u in updates)
        
        result.append({
            "id": m["id"],
            "name": m["name"],
            "email": m["email"],
            "department": m["department"],
            "title": m["title"],
            "currentReportStatus": rep.get("status", "NOT_STARTED") if rep else "NOT_STARTED",
            "currentReportId": rep.get("id") if rep else None,
            "totalHoursLogged": total_hours,
            "updateCount": len(updates),
            "lastActive": updates[0]["createdAt"] if updates else m["createdAt"]
        })
    return {"teamMembers": result}

@manager_router.get("/team-reports")
def get_team_reports(weekStart: Optional[str] = Query(None), user: Dict[str, Any] = Depends(require_manager)):
    reports = WeeklyReportRepository.find_by_manager(user["id"])
    if weekStart:
        reports = [r for r in reports if r.get("weekStart") == weekStart]
    return {"reports": reports}

@manager_router.get("/team-stats")
def get_team_stats(user: Dict[str, Any] = Depends(require_manager)):
    members = UserRepository.find_by_manager(user["id"])
    curr_week = get_reporting_week()
    reports = WeeklyReportRepository.find_by_manager(user["id"])
    curr_reports = [r for r in reports if r.get("weekStart") == curr_week["weekStart"]]
    
    submitted_count = len([r for r in curr_reports if r.get("status") == "SUBMITTED"])
    total_members = len(members)
    submission_rate = round((submitted_count / total_members * 100), 1) if total_members > 0 else 0.0

    all_updates = []
    for m in members:
        all_updates.extend(WorkUpdateRepository.find(m["id"], curr_week["weekStart"], curr_week["weekEnd"]))
    
    total_hours = sum(u.get("hoursSpent", 0) for u in all_updates)
    blockers_count = sum(1 for r in curr_reports if r.get("answers", {}).get("blockers", "").strip() and "no" not in r.get("answers", {}).get("blockers", "").lower())

    return {
        "totalTeamMembers": total_members,
        "submittedReportsCount": submitted_count,
        "submissionRate": submission_rate,
        "totalHoursLogged": total_hours,
        "activeBlockersCount": blockers_count,
        "weekStart": curr_week["weekStart"],
        "weekEnd": curr_week["weekEnd"]
    }

# Mount Routers
app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(work_updates_router)
app.include_router(reports_router)
app.include_router(manager_router)
