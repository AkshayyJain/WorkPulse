export type UserRole = 'EMPLOYEE' | 'MANAGER';
export type ReportStatus = 'DRAFT' | 'SUBMITTED';
export type AIStatus = 'NOT_STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  title: string;
  managerId?: string;
  managerName?: string;
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
  [key: string]: string;
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
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  answers: WeeklyReportAnswers;
  aiSummary?: AISummaryData;
  aiStatus: AIStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerEmployeeSummary {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  currentWeek: {
    weekStart: string;
    weekEnd: string;
    reportId?: string;
    status: ReportStatus | 'NOT_STARTED';
    aiStatus: AIStatus;
    submittedAt?: string;
    workUpdateCount: number;
    totalHoursLogged: number;
    lastActive: string | null;
  };
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
