export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly violations: Array<{ field: string; message: string }>,
  ) {
    super(400, 'VAL-001', message);
    this.name = 'ValidationError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(
    public readonly serviceName: string,
    message: string,
    public readonly cause?: Error,
  ) {
    super(502, 'SYS-002', message);
    this.name = 'ExternalServiceError';
  }
}
