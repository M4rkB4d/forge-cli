export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  errorCode: string;
  correlationId: string;
  timestamp: string;
  violations?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
