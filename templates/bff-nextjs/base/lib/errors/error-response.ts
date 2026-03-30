import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { ApiError } from './api-error';
import type { Logger } from 'pino';

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  errorCode: string;
  correlationId: string;
  timestamp: string;
  violations?: Array<{ field: string; message: string }>;
}

export function handleApiError(
  error: unknown,
  correlationId: string,
  log: Logger,
): Response {
  // Zod validation errors
  if (error instanceof ZodError) {
    const violations = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    log.warn({ violations }, 'Validation failed');

    return Response.json(
      buildProblem(400, 'Validation Failed', 'Request validation failed', 'VAL-001', correlationId, violations),
      { status: 400 },
    );
  }

  // Known API errors
  if (error instanceof ApiError) {
    log.warn({ errorCode: error.errorCode }, error.message);
    return Response.json(
      buildProblem(error.statusCode, error.name, error.message, error.errorCode, correlationId),
      { status: error.statusCode },
    );
  }

  // Axios errors from downstream services
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Pass through RFC 7807 errors from backend
    if (data?.errorCode) {
      log.warn({ status, errorCode: data.errorCode }, 'Backend error');
      return Response.json(
        { ...data, correlationId, timestamp: new Date().toISOString() },
        { status },
      );
    }

    log.error({ status, url: error.config?.url }, 'Downstream service error');
    return Response.json(
      buildProblem(502, 'Bad Gateway', 'Downstream service error', 'SYS-002', correlationId),
      { status: 502 },
    );
  }

  // Unexpected errors
  log.error({ err: error }, 'Unexpected error');
  return Response.json(
    buildProblem(500, 'Internal Server Error', 'An unexpected error occurred', 'SYS-001', correlationId),
    { status: 500 },
  );
}

function buildProblem(
  status: number,
  title: string,
  detail: string,
  errorCode: string,
  correlationId: string,
  violations?: Array<{ field: string; message: string }>,
): ProblemDetail {
  return {
    type: `https://api.example.com/errors/${errorCode.toLowerCase().split('-')[0]}`,
    title,
    status,
    detail,
    errorCode,
    correlationId,
    timestamp: new Date().toISOString(),
    ...(violations && { violations }),
  };
}
