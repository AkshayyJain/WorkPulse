import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export type UserRole = 'EMPLOYEE' | 'MANAGER';
export type ReportStatus = 'DRAFT' | 'SUBMITTED';
export type AIStatus = 'NOT_STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  department: string;
  title: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  category: string;
  required: boolean;
  active: boolean;
}

export interface WorkUpdate {
  id: string;
  employeeId: string;
  reportId?: string;
  workDate: string; // YYYY-MM-DD
  description: string;
  hoursSpent: number;
  projectTag: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReportAnswers {
  accomplishments: string;
  inProgress: string;
  blockers: string;
  nextWeekPriorities: string;
  [key: string]: string; // Support dynamic question answers
}

export interface AISummaryData {
  executiveSummary: string;
  keyAccomplishments: string[];
  currentWork: string[];
  blockers: string[];
  nextWeekPriorities: string[];
  generatedAt: string;
  model: string;
  rawText?: string;
}

export interface WeeklyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  managerId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  status: ReportStatus;
  answers: WeeklyReportAnswers;
  aiSummary?: AISummaryData;
  aiStatus: AIStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  questions: Question[];
  workUpdates: WorkUpdate[];
  weeklyReports: WeeklyReport[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial Question definitions
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    order: 1,
    text: 'What were your main accomplishments this week?',
    category: 'Accomplishments',
    required: true,
    active: true,
  },
  {
    id: 'q2',
    order: 2,
    text: 'What work is currently in progress?',
    category: 'In Progress',
    required: true,
    active: true,
  },
  {
    id: 'q3',
    order: 3,
    text: 'What blockers or challenges did you face?',
    category: 'Blockers',
    required: true,
    active: true,
  },
  {
    id: 'q4',
    order: 4,
    text: 'What are your priorities for next week?',
    category: 'Next Week Priorities',
    required: true,
    active: true,
  },
];

// Helper to get current week start (Monday) and end (Sunday)
export function getReportingWeek(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

// Format past week
export function getPastReportingWeek(weeksAgo: number): { weekStart: string; weekEnd: string } {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - (weeksAgo * 7));
  return getReportingWeek(targetDate);
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    questions: [],
    workUpdates: [],
    weeklyReports: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log(`[Database] Loaded existing database with ${this.data.users.length} users, ${this.data.weeklyReports.length} reports.`);
      } else {
        this.seedInitialData();
      }
    } catch (error) {
      console.error('[Database] Failed to load DB file, initializing seed data:', error);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Database] Error saving database file:', error);
    }
  }

  public seedInitialData() {
    console.log('[Database] Seeding initial users, questions, and sample reports...');
    const managerHash = bcrypt.hashSync('Manager@123', 10);
    const employeeHash = bcrypt.hashSync('Employee@123', 10);

    const users: User[] = [
      {
        id: 'usr_mgr_1',
        email: 'manager1@example.com',
        passwordHash: managerHash,
        name: 'Sarah Connor',
        role: 'MANAGER',
        department: 'Engineering',
        title: 'Senior Engineering Director',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_mgr_2',
        email: 'manager2@example.com',
        passwordHash: managerHash,
        name: 'David Miller',
        role: 'MANAGER',
        department: 'Product & QA',
        title: 'VP of Product',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_emp_1',
        email: 'employee1@example.com',
        passwordHash: employeeHash,
        name: 'Alex Rivera',
        role: 'EMPLOYEE',
        department: 'Engineering',
        title: 'Senior Frontend Engineer',
        managerId: 'usr_mgr_1',
        managerName: 'Sarah Connor',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_emp_2',
        email: 'employee2@example.com',
        passwordHash: employeeHash,
        name: 'Maya Chen',
        role: 'EMPLOYEE',
        department: 'Engineering',
        title: 'Backend Systems Engineer',
        managerId: 'usr_mgr_1',
        managerName: 'Sarah Connor',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_emp_3',
        email: 'employee3@example.com',
        passwordHash: employeeHash,
        name: 'Liam Patel',
        role: 'EMPLOYEE',
        department: 'Engineering',
        title: 'DevOps & Cloud Engineer',
        managerId: 'usr_mgr_1',
        managerName: 'Sarah Connor',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_emp_4',
        email: 'employee4@example.com',
        passwordHash: employeeHash,
        name: 'Jordan Taylor',
        role: 'EMPLOYEE',
        department: 'Product',
        title: 'Senior Data Analyst',
        managerId: 'usr_mgr_2',
        managerName: 'David Miller',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_emp_5',
        email: 'employee5@example.com',
        passwordHash: employeeHash,
        name: 'Chloe Bennett',
        role: 'EMPLOYEE',
        department: 'QA',
        title: 'QA Automation Lead',
        managerId: 'usr_mgr_2',
        managerName: 'David Miller',
        createdAt: new Date().toISOString(),
      },
    ];

    const currentWeek = getReportingWeek();
    const lastWeek = getPastReportingWeek(1);

    // Initial Work Updates for Alex Rivera (Current Week)
    const workUpdates: WorkUpdate[] = [
      {
        id: 'wu_1',
        employeeId: 'usr_emp_1',
        workDate: currentWeek.weekStart,
        description: 'Completed migration of frontend state management to context and refactored theme switcher module.',
        hoursSpent: 7.5,
        projectTag: 'UI Architecture',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'wu_2',
        employeeId: 'usr_emp_1',
        workDate: new Date(new Date(currentWeek.weekStart).getTime() + 86400000).toISOString().split('T')[0],
        description: 'Integrated jsPDF client-side export utility and tested report layout rendering across mobile viewpoints.',
        hoursSpent: 6.0,
        projectTag: 'Export & PDF',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'wu_3',
        employeeId: 'usr_emp_2',
        workDate: lastWeek.weekStart,
        description: 'Optimized MongoDB database queries and added compound indexes for high-concurrency weekly reports.',
        hoursSpent: 8.0,
        projectTag: 'Database & Perf',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
    ];

    // Seeded submitted report from Maya Chen (last week) for Manager 1 to view immediately
    const pastReportMaya: WeeklyReport = {
      id: 'rep_maya_past_1',
      employeeId: 'usr_emp_2',
      employeeName: 'Maya Chen',
      employeeEmail: 'employee2@example.com',
      managerId: 'usr_mgr_1',
      weekStart: lastWeek.weekStart,
      weekEnd: lastWeek.weekEnd,
      status: 'SUBMITTED',
      answers: {
        accomplishments: 'Delivered high-throughput indexing for the report collection and patched JWT token renewal mechanism.',
        inProgress: 'Developing rate-limiter middleware for external AI service retries.',
        blockers: 'None this week. Test environment connectivity was restored.',
        nextWeekPriorities: 'Finalize asynchronous email notification dispatch queue.',
      },
      aiSummary: {
        executiveSummary: 'Maya completed database indexing optimization and patched the authentication refresh token flow, moving next to asynchronous worker queues with zero active blockers.',
        keyAccomplishments: [
          'Optimized MongoDB indexes for weekly reports collection',
          'Patched JWT session validation security handler',
          'Refactored database connection pooling',
        ],
        currentWork: [
          'Developing rate-limiter middleware for AI service retries',
        ],
        blockers: [
          'No blockers encountered this reporting cycle',
        ],
        nextWeekPriorities: [
          'Implement asynchronous email notification dispatch queue',
          'Coordinate end-to-end load testing with QA team',
        ],
        generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        model: 'gemini-3.7-flash',
      },
      aiStatus: 'COMPLETED',
      submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    };

    // Seeded submitted report from Jordan Taylor (last week) for Manager 2
    const pastReportJordan: WeeklyReport = {
      id: 'rep_jordan_past_1',
      employeeId: 'usr_emp_4',
      employeeName: 'Jordan Taylor',
      employeeEmail: 'employee4@example.com',
      managerId: 'usr_mgr_2',
      weekStart: lastWeek.weekStart,
      weekEnd: lastWeek.weekEnd,
      status: 'SUBMITTED',
      answers: {
        accomplishments: 'Built weekly productivity telemetry dashboard and cleaned quarterly reporting metrics.',
        inProgress: 'Investigating anomaly detection for missing weekly submissions.',
        blockers: 'Waiting for stakeholder approval on retention metrics definition.',
        nextWeekPriorities: 'Automate weekly reminder alerts for all departmental staff.',
      },
      aiSummary: {
        executiveSummary: 'Jordan delivered key reporting telemetry dashboards and is progressing on submission anomaly tracking while resolving metric definition dependencies.',
        keyAccomplishments: [
          'Completed quarterly reporting telemetry analytics dashboard',
          'Harmonized cross-departmental productivity metrics schema',
        ],
        currentWork: [
          'Building submission anomaly detection pipeline',
        ],
        blockers: [
          'Awaiting stakeholder sign-off on retention metric definitions',
        ],
        nextWeekPriorities: [
          'Automate automated weekly reminder alert triggers',
        ],
        generatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        model: 'gemini-3.7-flash',
      },
      aiStatus: 'COMPLETED',
      submittedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    };

    this.data = {
      users,
      questions: DEFAULT_QUESTIONS,
      workUpdates,
      weeklyReports: [pastReportMaya, pastReportJordan],
      auditLogs: [
        {
          id: 'log_init',
          userId: 'system',
          userEmail: 'system@workpulse.local',
          action: 'SYSTEM_INITIALIZED',
          resourceType: 'SYSTEM',
          resourceId: 'all',
          details: 'Initial database schema and default records seeded successfully.',
          timestamp: new Date().toISOString(),
        }
      ],
    };

    this.save();
  }

  // --- User Repository ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findEmployeesByManagerId(managerId: string): User[] {
    return this.data.users.filter(u => u.role === 'EMPLOYEE' && u.managerId === managerId);
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  // --- Questions Repository ---
  public getQuestions(): Question[] {
    return this.data.questions.filter(q => q.active).sort((a, b) => a.order - b.order);
  }

  public getAllQuestions(): Question[] {
    return this.data.questions.sort((a, b) => a.order - b.order);
  }

  public addQuestion(question: Omit<Question, 'id'>): Question {
    const newQ: Question = {
      ...question,
      id: `q_${Date.now()}`,
    };
    this.data.questions.push(newQ);
    this.save();
    return newQ;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = { ...this.data.questions[idx], ...updates };
    this.save();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.data.questions[idx].active = false;
    this.save();
    return true;
  }

  // --- Work Updates Repository ---
  public getWorkUpdatesByEmployeeAndWeek(employeeId: string, weekStart: string, weekEnd?: string): WorkUpdate[] {
    return this.data.workUpdates
      .filter(wu => {
        if (wu.employeeId !== employeeId) return false;
        if (weekEnd) {
          return wu.workDate >= weekStart && wu.workDate <= weekEnd;
        }
        return wu.workDate >= weekStart;
      })
      .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
  }

  public getWorkUpdatesByEmployee(employeeId: string): WorkUpdate[] {
    return this.data.workUpdates
      .filter(wu => wu.employeeId === employeeId)
      .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
  }

  public getWorkUpdateById(id: string): WorkUpdate | undefined {
    return this.data.workUpdates.find(wu => wu.id === id);
  }

  public createWorkUpdate(data: Omit<WorkUpdate, 'id' | 'createdAt' | 'updatedAt'>): WorkUpdate {
    const newWU: WorkUpdate = {
      ...data,
      id: `wu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.workUpdates.push(newWU);
    this.save();
    return newWU;
  }

  public updateWorkUpdate(id: string, updates: Partial<Omit<WorkUpdate, 'id' | 'employeeId' | 'createdAt'>>): WorkUpdate | null {
    const idx = this.data.workUpdates.findIndex(wu => wu.id === id);
    if (idx === -1) return null;
    this.data.workUpdates[idx] = {
      ...this.data.workUpdates[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.workUpdates[idx];
  }

  public deleteWorkUpdate(id: string): boolean {
    const idx = this.data.workUpdates.findIndex(wu => wu.id === id);
    if (idx === -1) return false;
    this.data.workUpdates.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Weekly Reports Repository ---
  public getReportById(id: string): WeeklyReport | undefined {
    return this.data.weeklyReports.find(r => r.id === id);
  }

  public getReportByEmployeeAndWeek(employeeId: string, weekStart: string): WeeklyReport | undefined {
    return this.data.weeklyReports.find(r => r.employeeId === employeeId && r.weekStart === weekStart);
  }

  public getReportsByEmployee(employeeId: string): WeeklyReport[] {
    return this.data.weeklyReports
      .filter(r => r.employeeId === employeeId)
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  }

  public getReportsByManager(managerId: string): WeeklyReport[] {
    return this.data.weeklyReports
      .filter(r => r.managerId === managerId)
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  }

  public createReport(reportData: Omit<WeeklyReport, 'id' | 'createdAt' | 'updatedAt'>): WeeklyReport {
    const newReport: WeeklyReport = {
      ...reportData,
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.weeklyReports.push(newReport);
    this.save();
    return newReport;
  }

  public updateReport(id: string, updates: Partial<Omit<WeeklyReport, 'id' | 'employeeId' | 'createdAt'>>): WeeklyReport | null {
    const idx = this.data.weeklyReports.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.weeklyReports[idx] = {
      ...this.data.weeklyReports[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.weeklyReports[idx];
  }

  // --- Audit Logging ---
  public logAudit(userId: string, userEmail: string, action: string, resourceType: string, resourceId: string, details?: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.push(log);
    this.save();
  }

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return [...this.data.auditLogs].reverse().slice(0, limit);
  }

  public resetToDefault() {
    this.seedInitialData();
  }
}

export const db = new Database();
