import { type Request, type Response, type NextFunction } from 'express';

interface Error {
  status?: number;
  statusCode?: number;
  stack?: string;
  message: string;
}

export function logErrors(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err.stack) {
    console.error(`${err.stack}\n`);
  }

  next(err);
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  const statusCodeFromError = err.status ?? err.statusCode ?? 500;

  res.status(statusCodeFromError).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `[${req.method}] ${req.originalUrl} not found!`
  });
}
