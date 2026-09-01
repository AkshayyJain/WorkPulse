import { Router, Response } from 'express';
import { db, getReportingWeek, WeeklyReport } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';
import { generateReportSummary } from '../ai.js';

export const reportRouter = Router();

// Helper to check report access permissions
function canAccessReport(user: { id: string; role: string }, report: WeeklyReport): boolean {
  if (user.role === 'EMPLOYEE') {
    return report.employeeId === user.id;
  }
  if (user.role === 'MANAGER') {
    return report.managerId === user.id;
  }
  return false;
}

// GET /api/reports/current - Get or initialize current week's report for employee
reportRouter.get('/current', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'EMPLOYEE') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Current reporting endpoint is designed for employee users.',
    });
    return;
  }

  const { weekStart, weekEnd } = getReportingWeek();

  let report = db.getReportByEmployeeAndWeek(user.id, weekStart);

  if (!report) {
    report = db.createReport({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      managerId: user.managerId || '',
      weekStart,
      weekEnd,
      status: 'DRAFT',
      answers: {
        accomplishments: '',
        inProgress: '',
        blockers: '',
        nextWeekPriorities: '',
      },
      aiStatus: 'NOT_STARTED',
    });

    db.logAudit(user.id, user.email, 'REPORT_DRAFT_INITIALIZED', 'REPORT', report.id, `Created draft for week ${weekStart}`);
  }

  const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(user.id, weekStart, weekEnd);

  res.json({
    report,
    workUpdates,
  });
});

// GET /api/reports/history - Get all past reports for current employee
reportRouter.get('/history', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'EMPLOYEE') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'History endpoint is restricted to employee users.',
    });
    return;
  }

  const reports = db.getReportsByEmployee(user.id);
  res.json({ reports });
});

// GET /api/reports/:id - Get specific report with updates
reportRouter.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const report = db.getReportById(id);
  if (!report) {
    res.status(404).json({
      error: 'Not Found',
      message: `Report with ID '${id}' does not exist.`,
    });
    return;
  }

  if (!canAccessReport(user, report)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to view this weekly report.',
    });
    return;
  }

  const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(report.employeeId, report.weekStart, report.weekEnd);

  res.json({
    report,
    workUpdates,
  });
});

// POST /api/reports/draft - Save or update draft report
reportRouter.post('/draft', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'EMPLOYEE') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only employees can create or update draft reports.',
    });
    return;
  }

  const { reportId, weekStart, weekEnd, answers } = req.body;

  let report: WeeklyReport | undefined;

  if (reportId) {
    report = db.getReportById(reportId);
    if (!report) {
      res.status(404).json({ error: 'Not Found', message: 'Report not found.' });
      return;
    }
    if (report.employeeId !== user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Unauthorized report access.' });
      return;
    }
  } else if (weekStart) {
    report = db.getReportByEmployeeAndWeek(user.id, weekStart);
  }

  if (report && report.status === 'SUBMITTED') {
    res.status(400).json({
      error: 'Report Submitted',
      message: 'This report has already been submitted and cannot be modified.',
    });
    return;
  }

  if (report) {
    const updated = db.updateReport(report.id, {
      answers: {
        ...report.answers,
        ...(answers || {}),
      },
    });

    db.logAudit(user.id, user.email, 'REPORT_DRAFT_SAVED', 'REPORT', report.id, 'Draft answers updated');
    res.json({ report: updated, message: 'Draft saved successfully.' });
  } else {
    const period = weekStart && weekEnd ? { weekStart, weekEnd } : getReportingWeek();
    const created = db.createReport({
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      managerId: user.managerId || '',
      weekStart: period.weekStart,
      weekEnd: period.weekEnd,
      status: 'DRAFT',
      answers: answers || {
        accomplishments: '',
        inProgress: '',
        blockers: '',
        nextWeekPriorities: '',
      },
      aiStatus: 'NOT_STARTED',
    });

    db.logAudit(user.id, user.email, 'REPORT_DRAFT_CREATED', 'REPORT', created.id, 'New draft created');
    res.status(201).json({ report: created, message: 'Draft created successfully.' });
  }
});

// POST /api/reports/:id/submit - Finalize submission and generate AI summary
reportRouter.post('/:id/submit', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { answers } = req.body;

  if (user.role !== 'EMPLOYEE') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only employees can submit weekly reports.',
    });
    return;
  }

  const report = db.getReportById(id);
  if (!report) {
    res.status(404).json({
      error: 'Not Found',
      message: `Report with ID '${id}' does not exist.`,
    });
    return;
  }

  if (report.employeeId !== user.id) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only submit your own weekly report.',
    });
    return;
  }

  if (report.status === 'SUBMITTED') {
    res.status(400).json({
      error: 'Already Submitted',
      message: 'This report is already submitted and locked.',
    });
    return;
  }

  // Merge any submitted answers
  const finalAnswers = {
    ...report.answers,
    ...(answers || {}),
  };

  // Validate the four required questions
  const missing: string[] = [];
  if (!finalAnswers.accomplishments || finalAnswers.accomplishments.trim().length === 0) {
    missing.push('Accomplishments');
  }
  if (!finalAnswers.inProgress || finalAnswers.inProgress.trim().length === 0) {
    missing.push('Work in progress');
  }
  if (!finalAnswers.blockers || finalAnswers.blockers.trim().length === 0) {
    missing.push('Blockers and challenges');
  }
  if (!finalAnswers.nextWeekPriorities || finalAnswers.nextWeekPriorities.trim().length === 0) {
    missing.push('Next week priorities');
  }

  if (missing.length > 0) {
    res.status(422).json({
      error: 'Validation Error',
      message: `Please complete all required weekly questions before submitting. Missing: ${missing.join(', ')}.`,
      missingFields: missing,
    });
    return;
  }

  // Step 1: Persist SUBMITTED status and lock report immediately
  const submittedAt = new Date().toISOString();
  db.updateReport(report.id, {
    status: 'SUBMITTED',
    answers: finalAnswers,
    submittedAt,
    aiStatus: 'PROCESSING',
  });

  db.logAudit(user.id, user.email, 'REPORT_SUBMITTED', 'REPORT', report.id, `Report locked and submitted for week ${report.weekStart}`);

  // Step 2: Retrieve daily work updates
  const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(user.id, report.weekStart, report.weekEnd);

  // Step 3: Call AI Summary Service safely
  try {
    const aiSummary = await generateReportSummary({
      employeeName: user.name,
      reportingPeriod: `${report.weekStart} to ${report.weekEnd}`,
      workUpdates,
      answers: finalAnswers,
    });

    const updatedReport = db.updateReport(report.id, {
      aiSummary,
      aiStatus: 'COMPLETED',
    });

    db.logAudit(user.id, user.email, 'AI_SUMMARY_GENERATED', 'REPORT', report.id, `AI summary created using ${aiSummary.model}`);

    res.json({
      report: updatedReport,
      workUpdates,
      message: 'Weekly report submitted successfully and AI summary generated.',
    });
  } catch (error: any) {
    console.error('[Report Submission] AI Generation error:', error);
    // Safe failure: report remains SUBMITTED!
    const updatedReport = db.updateReport(report.id, {
      aiStatus: 'FAILED',
    });

    db.logAudit(user.id, user.email, 'AI_SUMMARY_FAILED', 'REPORT', report.id, `AI error: ${error.message}`);

    res.json({
      report: updatedReport,
      workUpdates,
      message: 'Report submitted successfully. AI summary generation encountered a temporary issue and can be retried.',
    });
  }
});

// POST /api/reports/:id/retry-ai - Retry AI summary generation
reportRouter.post('/:id/retry-ai', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const report = db.getReportById(id);
  if (!report) {
    res.status(404).json({ error: 'Not Found', message: 'Report not found.' });
    return;
  }

  if (!canAccessReport(user, report)) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
    return;
  }

  if (report.status !== 'SUBMITTED') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'AI summary can only be generated for submitted reports.',
    });
    return;
  }

  try {
    const workUpdates = db.getWorkUpdatesByEmployeeAndWeek(report.employeeId, report.weekStart, report.weekEnd);
    const aiSummary = await generateReportSummary({
      employeeName: report.employeeName,
      reportingPeriod: `${report.weekStart} to ${report.weekEnd}`,
      workUpdates,
      answers: report.answers,
    });

    const updatedReport = db.updateReport(report.id, {
      aiSummary,
      aiStatus: 'COMPLETED',
    });

    db.logAudit(user.id, user.email, 'AI_SUMMARY_RETRIED', 'REPORT', report.id, `Retried AI summary successfully with ${aiSummary.model}`);

    res.json({
      report: updatedReport,
      workUpdates,
      message: 'AI summary successfully regenerated.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'AI Error',
      message: `Failed to regenerate AI summary: ${error.message || 'Service temporarily unavailable'}`,
    });
  }
});
