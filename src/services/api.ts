import {
  User,
  Question,
  WorkUpdate,
  WeeklyReport,
  WeeklyReportAnswers,
  ManagerEmployeeSummary,
  AuditLog,
} from '../types';

const RAW_API_BASE = import.meta.env.VITE_API_BASE || '/api';
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('workpulse_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('workpulse_token');
        localStorage.removeItem('workpulse_user');
      }
      const errorMsg = data.message || data.error || `HTTP ${response.status}: Request failed`;
      const err = new Error(errorMsg);
      (err as any).status = response.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  }

  // --- Auth APIs ---
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async resetDemo(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-demo', {
      method: 'POST',
    });
  }

  // --- Questions APIs ---
  async getQuestions(): Promise<{ questions: Question[] }> {
    return this.request<{ questions: Question[] }>('/questions');
  }

  async createQuestion(data: { text: string; category?: string; required?: boolean; order?: number }): Promise<{ question: Question }> {
    return this.request<{ question: Question }>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: Partial<Question>): Promise<{ question: Question }> {
    return this.request<{ question: Question }>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Work Updates APIs ---
  async getWorkUpdates(params?: { employeeId?: string; weekStart?: string; weekEnd?: string }): Promise<{ workUpdates: WorkUpdate[] }> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.weekStart) query.append('weekStart', params.weekStart);
    if (params?.weekEnd) query.append('weekEnd', params.weekEnd);

    const qs = query.toString();
    return this.request<{ workUpdates: WorkUpdate[] }>(`/work-updates${qs ? `?${qs}` : ''}`);
  }

  async createWorkUpdate(data: {
    workDate: string;
    description: string;
    hoursSpent: number;
    projectTag?: string;
  }): Promise<{ workUpdate: WorkUpdate }> {
    return this.request<{ workUpdate: WorkUpdate }>('/work-updates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkUpdate(
    id: string,
    data: Partial<{ workDate: string; description: string; hoursSpent: number; projectTag: string }>
  ): Promise<{ workUpdate: WorkUpdate }> {
    return this.request<{ workUpdate: WorkUpdate }>(`/work-updates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkUpdate(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/work-updates/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Report APIs ---
  async getCurrentReport(): Promise<{ report: WeeklyReport; workUpdates: WorkUpdate[] }> {
    return this.request<{ report: WeeklyReport; workUpdates: WorkUpdate[] }>('/reports/current');
  }

  async getReportHistory(): Promise<{ reports: WeeklyReport[] }> {
    return this.request<{ reports: WeeklyReport[] }>('/reports/history');
  }

  async getReportById(id: string): Promise<{ report: WeeklyReport; workUpdates: WorkUpdate[] }> {
    return this.request<{ report: WeeklyReport; workUpdates: WorkUpdate[] }>(`/reports/${id}`);
  }

  async saveDraft(data: {
    reportId?: string;
    weekStart?: string;
    weekEnd?: string;
    answers: WeeklyReportAnswers;
  }): Promise<{ report: WeeklyReport; message: string }> {
    return this.request<{ report: WeeklyReport; message: string }>('/reports/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitReport(id: string, answers?: WeeklyReportAnswers): Promise<{
    report: WeeklyReport;
    workUpdates: WorkUpdate[];
    message: string;
  }> {
    return this.request<{ report: WeeklyReport; workUpdates: WorkUpdate[]; message: string }>(
      `/reports/${id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }
    );
  }

  async retryAISummary(id: string): Promise<{
    report: WeeklyReport;
    workUpdates: WorkUpdate[];
    message: string;
  }> {
    return this.request<{ report: WeeklyReport; workUpdates: WorkUpdate[]; message: string }>(
      `/reports/${id}/retry-ai`,
      {
        method: 'POST',
      }
    );
  }

  // --- Manager APIs ---
  async getManagerEmployees(): Promise<{
    manager: User;
    reportingWeek: { weekStart: string; weekEnd: string };
    employees: ManagerEmployeeSummary[];
  }> {
    return this.request<{
      manager: User;
      reportingWeek: { weekStart: string; weekEnd: string };
      employees: ManagerEmployeeSummary[];
    }>('/manager/employees');
  }

  async getManagerReports(): Promise<{ reports: WeeklyReport[]; totalCount: number }> {
    return this.request<{ reports: WeeklyReport[]; totalCount: number }>('/manager/reports');
  }

  async getManagerReportById(id: string): Promise<{ report: WeeklyReport; workUpdates: WorkUpdate[] }> {
    return this.request<{ report: WeeklyReport; workUpdates: WorkUpdate[] }>(`/manager/reports/${id}`);
  }

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>('/manager/audit-logs');
  }
}

export const api = new ApiService();
