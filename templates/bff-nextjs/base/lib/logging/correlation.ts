import type { NextRequest } from 'next/server';

const CORRELATION_HEADER = 'x-correlation-id';

export function getCorrelationId(request: NextRequest): string {
  return request.headers.get(CORRELATION_HEADER) ?? crypto.randomUUID();
}
