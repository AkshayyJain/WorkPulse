import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.js';
import { authRouter } from './server/routes/authRoutes.js';
import { questionRouter } from './server/routes/questionRoutes.js';
import { workUpdateRouter } from './server/routes/workUpdateRoutes.js';
import { reportRouter } from './server/routes/reportRoutes.js';
import { managerRouter } from './server/routes/managerRoutes.js';
import { db } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security and parsing middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*') || config.nodeEnv === 'development')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Request logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health and System Diagnostics
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'WorkPulse API Server',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      database: 'Connected (JSON Store & Memory Index)',
      aiConfigured: Boolean(config.geminiApiKey),
      aiModel: config.geminiModel,
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/questions', questionRouter);
  app.use('/api/work-updates', workUpdateRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/manager', managerRouter);

  // Central Error Handler for API routes
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Error Handler]', err);
    res.status(err.status || 500).json({
      error: err.name || 'Internal Server Error',
      message: err.message || 'An unexpected error occurred processing your request.',
    });
  });

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Mounting Vite development middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Serving production static files from dist directory...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 WorkPulse Server active on http://0.0.0.0:${PORT}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log(`🔑 AI Provider: ${config.geminiApiKey ? 'Gemini API Enabled' : 'Simulated Synthesizer (Fallback)'}`);
    console.log(`👥 Seeded Demo Accounts Ready`);
    console.log(`=================================================`);
  });
}

startServer().catch(err => {
  console.error('[Server Startup Failure]:', err);
});
