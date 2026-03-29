import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const HEADER = 'x-correlation-id';

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers[HEADER] as string) || uuidv4();
  req.headers[HEADER] = id;
  res.setHeader(HEADER, id);
  next();
}
