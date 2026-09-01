import { Router, Response } from 'express';
import { db, getReportingWeek } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

export const workUpdateRouter = Router();

// GET /api/work-updates - Get work updates for authenticated employee or assigned employee
workUpdateRouter.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { employeeId, weekStart, weekEnd } = req.query as {
    employeeId?: string;
    weekStart?: string;
    weekEnd?: string;
  };

  let targetEmployeeId = user.id;

  // If a manager requests updates for an employee, verify assigned relationship
  if (employeeId && employeeId !== user.id) {
    if (user.role !== 'MANAGER') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Employees cannot access work logs belonging to other employees.',
      });
      return;
    }

    const assignedEmployees = db.findEmployeesByManagerId(user.id);
    const isAssigned = assignedEmployees.some(e => e.id === employeeId);
    if (!isAssigned) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view work updates for this employee.',
      });
      return;
    }
    targetEmployeeId = employeeId;
  }

  let updates = db.getWorkUpdatesByEmployee(targetEmployeeId);

  if (weekStart) {
    updates = updates.filter(u => u.workDate >= weekStart && (!weekEnd || u.workDate <= weekEnd));
  }

  res.json({ workUpdates: updates });
});

// POST /api/work-updates - Create work update (Employee only)
workUpdateRouter.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'EMPLOYEE') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only employees can create daily work updates.',
    });
    return;
  }

  const { workDate, description, hoursSpent, projectTag } = req.body;

  if (!workDate || !description || typeof description !== 'string' || description.trim().length === 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Work date and description are required fields.',
    });
    return;
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid work date format. Expected YYYY-MM-DD.',
    });
    return;
  }

  // Check if report for this week is already submitted
  const { weekStart } = getReportingWeek(new Date(workDate));
  const existingReport = db.getReportByEmployeeAndWeek(user.id, weekStart);

  if (existingReport && existingReport.status === 'SUBMITTED') {
    res.status(400).json({
      error: 'Report Submitted',
      message: `Cannot add work updates for the week of ${weekStart} because the weekly report has already been submitted and is locked.`,
    });
    return;
  }

  const newUpdate = db.createWorkUpdate({
    employeeId: user.id,
    reportId: existingReport?.id,
    workDate: workDate.trim(),
    description: description.trim(),
    hoursSpent: Number(hoursSpent) || 0,
    projectTag: projectTag ? projectTag.trim() : 'General',
  });

  db.logAudit(user.id, user.email, 'WORK_UPDATE_CREATED', 'WORK_UPDATE', newUpdate.id, `Logged ${newUpdate.hoursSpent}h on ${newUpdate.workDate}`);

  res.status(201).json({ workUpdate: newUpdate });
});

// PUT /api/work-updates/:id - Edit work update (Employee owner only, draft week only)
workUpdateRouter.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { workDate, description, hoursSpent, projectTag } = req.body;

  const existingUpdate = db.getWorkUpdateById(id);
  if (!existingUpdate) {
    res.status(404).json({
      error: 'Not Found',
      message: `Work update with ID '${id}' not found.`,
    });
    return;
  }

  // Check ownership
  if (existingUpdate.employeeId !== user.id) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to edit work updates belonging to another user.',
    });
    return;
  }

  // Check if report is already submitted
  const targetDate = workDate || existingUpdate.workDate;
  const { weekStart } = getReportingWeek(new Date(targetDate));
  const existingReport = db.getReportByEmployeeAndWeek(user.id, weekStart);

  if (existingReport && existingReport.status === 'SUBMITTED') {
    res.status(400).json({
      error: 'Report Submitted',
      message: 'Cannot modify work updates for a week whose report has already been submitted.',
    });
    return;
  }

  const updated = db.updateWorkUpdate(id, {
    ...(workDate ? { workDate: workDate.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
    ...(hoursSpent !== undefined ? { hoursSpent: Number(hoursSpent) } : {}),
    ...(projectTag !== undefined ? { projectTag: projectTag.trim() } : {}),
  });

  db.logAudit(user.id, user.email, 'WORK_UPDATE_UPDATED', 'WORK_UPDATE', id, 'Modified work update');

  res.json({ workUpdate: updated });
});

// DELETE /api/work-updates/:id - Delete work update (Employee owner only, draft week only)
workUpdateRouter.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const existingUpdate = db.getWorkUpdateById(id);
  if (!existingUpdate) {
    res.status(404).json({
      error: 'Not Found',
      message: `Work update with ID '${id}' not found.`,
    });
    return;
  }

  // Check ownership
  if (existingUpdate.employeeId !== user.id) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to delete work updates belonging to another user.',
    });
    return;
  }

  // Check if report is already submitted
  const { weekStart } = getReportingWeek(new Date(existingUpdate.workDate));
  const existingReport = db.getReportByEmployeeAndWeek(user.id, weekStart);

  if (existingReport && existingReport.status === 'SUBMITTED') {
    res.status(400).json({
      error: 'Report Submitted',
      message: 'Cannot delete work updates for a submitted weekly reporting period.',
    });
    return;
  }

  db.deleteWorkUpdate(id);
  db.logAudit(user.id, user.email, 'WORK_UPDATE_DELETED', 'WORK_UPDATE', id, 'Deleted work update');

  res.json({ message: 'Work update successfully deleted.' });
});
