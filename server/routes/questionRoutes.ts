import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, AuthRequest } from '../auth.js';

export const questionRouter = Router();

// GET /api/questions - List all active questions (or all for managers)
questionRouter.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const isManager = req.user?.role === 'MANAGER';
  const questions = isManager ? db.getAllQuestions() : db.getQuestions();
  res.json({ questions });
});

// POST /api/questions - Add custom question (Manager only)
questionRouter.post('/', requireAuth, requireRole('MANAGER'), (req: AuthRequest, res: Response) => {
  const { text, category, required, order } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Question text is required and cannot be empty.',
    });
    return;
  }

  const existing = db.getAllQuestions();
  const nextOrder = typeof order === 'number' ? order : existing.length + 1;

  const newQuestion = db.addQuestion({
    text: text.trim(),
    category: category ? category.trim() : 'General',
    required: Boolean(required),
    order: nextOrder,
    active: true,
  });

  db.logAudit(
    req.user!.id,
    req.user!.email,
    'QUESTION_CREATED',
    'QUESTION',
    newQuestion.id,
    `Added question: ${newQuestion.text}`
  );

  res.status(201).json({ question: newQuestion });
});

// PUT /api/questions/:id - Update question (Manager only)
questionRouter.put('/:id', requireAuth, requireRole('MANAGER'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { text, category, required, active, order } = req.body;

  const updated = db.updateQuestion(id, {
    ...(text !== undefined ? { text: text.trim() } : {}),
    ...(category !== undefined ? { category: category.trim() } : {}),
    ...(required !== undefined ? { required: Boolean(required) } : {}),
    ...(active !== undefined ? { active: Boolean(active) } : {}),
    ...(order !== undefined ? { order: Number(order) } : {}),
  });

  if (!updated) {
    res.status(404).json({
      error: 'Not Found',
      message: `Question with ID '${id}' does not exist.`,
    });
    return;
  }

  db.logAudit(
    req.user!.id,
    req.user!.email,
    'QUESTION_UPDATED',
    'QUESTION',
    id,
    `Updated question: ${updated.text}`
  );

  res.json({ question: updated });
});

// DELETE /api/questions/:id - Soft-delete / deactivate question (Manager only)
questionRouter.delete('/:id', requireAuth, requireRole('MANAGER'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const success = db.deleteQuestion(id);
  if (!success) {
    res.status(404).json({
      error: 'Not Found',
      message: `Question with ID '${id}' not found.`,
    });
    return;
  }

  db.logAudit(
    req.user!.id,
    req.user!.email,
    'QUESTION_DELETED',
    'QUESTION',
    id,
    'Deactivated question'
  );

  res.json({ message: 'Question successfully deactivated.' });
});
