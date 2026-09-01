import { Router, Response } from 'express';
import { db, getReportingWeek } from '../db.js';
import { requireAuth, requireRole, AuthRequest } from '../auth.js';

export const managerRouter = Router();

// Ensure all manager routes require authentication and MANAGER role
managerRouter.use(requireAuth, requireRole('MANAGER'));

// GET /api/manager/employees - Get assigned employees with current week status
managerRouter.get('/employees', (req: AuthRequest, res: Response) => {
  const manager = req.user!;
  const assignedEmployees = db.findEmployeesByManagerId(manager.id);
  const { weekStart, weekEnd } = getReportingWeek();

  const employeeSummaries = assignedEmployees.map(emp => {
    const currentReport = db.getReportByEmployeeAndWeek(emp.id, weekStart);
    const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(emp.id, weekStart, weekEnd);
    const totalHours = workUpdates.reduce((sum, u) => sum + (u.hoursSpent || 0), 0);

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      title: emp.title,
      currentWeek: {
        weekStart,
        weekEnd,
        reportId: currentReport?.id,
        status: currentReport ? currentReport.status : 'NOT_STARTED',
        aiStatus: currentReport?.aiStatus || 'NOT_STARTED',
        submittedAt: currentReport?.submittedAt,
        workUpdateCount: workUpdates.length,
        totalHoursLogged: totalHours,
        lastActive: workUpdates.length > 0 ? workUpdates[0].createdAt : null,
      },
    };
  });

  res.json({
    manager: {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      department: manager.department,
      title: manager.title,
    },
    reportingWeek: { weekStart, weekEnd },
    employees: employeeSummaries,
  });
});

// GET /api/manager/reports - Get all reports for assigned employees
managerRouter.get('/reports', (req: AuthRequest, res: Response) => {
  const manager = req.user!;
  const assignedEmployees = db.findEmployeesByManagerId(manager.id);
  const assignedEmployeeIds = new Set(assignedEmployees.map(e => e.id));

  // Filter reports belonging strictly to assigned employees
  const reports = db.getReportsByManager(manager.id).filter(r => assignedEmployeeIds.has(r.employeeId));

  res.json({
    reports,
    totalCount: reports.length,
  });
});

// GET /api/manager/reports/:id - Get detailed report for assigned employee
managerRouter.get('/reports/:id', (req: AuthRequest, res: Response) => {
  const manager = req.user!;
  const { id } = req.params;

  const report = db.getReportById(id);
  if (!report) {
    res.status(404).json({
      error: 'Not Found',
      message: `Report with ID '${id}' does not exist.`,
    });
    return;
  }

  // Strict check: Is this employee assigned to this manager?
  const assignedEmployees = db.findEmployeesByManagerId(manager.id);
  const isAssigned = assignedEmployees.some(e => e.id === report.employeeId);

  if (!isAssigned && report.managerId !== manager.id) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: You are not authorized to view reports for employees not assigned to your management line.',
    });
    return;
  }

  const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(report.employeeId, report.weekStart, report.weekEnd);

  db.logAudit(manager.id, manager.email, 'MANAGER_VIEW_REPORT', 'REPORT', report.id, `Manager viewed report of ${report.employeeName}`);

  res.json({
    report,
    workUpdates,
  });
});

// GET /api/manager/audit-logs - View audit trail
managerRouter.get('/audit-logs', (req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs(100);
  res.json({ logs });
});
