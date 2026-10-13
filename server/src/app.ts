import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import type Database from 'better-sqlite3';
import { InvoiceRepository } from './repository.js';
import { invoiceRoutes } from './routes.js';
import { HttpError } from './errors.js';
export function createApp(
  db: Database.Database,
  origin = 'http://localhost:5173',
  staticDirectory?: string,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  });
  app.use('/api/invoices', invoiceRoutes(new InvoiceRepository(db)));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'API route not found.')));
  if (staticDirectory) app.use(express.static(staticDirectory));
  app.use((_req, _res, next) => next(new HttpError(404, 'Route not found.')));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: {
          message: 'Validation failed.',
          issues: error.issues.map((i) => ({
            field: i.path.join('.') || 'body',
            message: i.message,
          })),
        },
      });
      return;
    }
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: { message: error.message } });
      return;
    }
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({ error: { message: 'Request body exceeds 16 KB.' } });
      return;
    }
    console.error(error);
    res.status(500).json({ error: { message: 'An unexpected server error occurred.' } });
  };
  app.use(errorHandler);
  return app;
}
