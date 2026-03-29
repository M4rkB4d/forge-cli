import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const status = (err as any).status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  console.error(`[${req.headers['x-correlation-id']}] ${err.stack || err.message}`);

  res.status(status).json({
    error: err.name || 'Error',
    message,
    timestamp: new Date().toISOString(),
  });
}
