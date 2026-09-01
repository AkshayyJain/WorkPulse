import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAuth, AuthRequest } from '../auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Both email and password are required fields.',
    });
    return;
  }

  const user = db.findUserByEmail(email.trim());
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid email credentials.',
    });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid password credentials.',
    });
    return;
  }

  const token = generateToken(user);

  db.logAudit(user.id, user.email, 'USER_LOGIN', 'USER', user.id, `User logged in with role ${user.role}`);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      title: user.title,
      managerId: user.managerId,
      managerName: user.managerName,
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      title: user.title,
      managerId: user.managerId,
      managerName: user.managerName,
    },
  });
});

// POST /api/auth/reset-demo (Reset database to initial seed values)
authRouter.post('/reset-demo', requireAuth, (req: AuthRequest, res: Response) => {
  db.resetToDefault();
  db.logAudit(req.user!.id, req.user!.email, 'DATABASE_RESET', 'SYSTEM', 'all', 'Reset database to initial seed');
  res.json({ message: 'Database successfully reset to initial seed state.' });
});
