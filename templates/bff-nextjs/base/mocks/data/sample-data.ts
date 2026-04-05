import type { BackendSampleResponse, BackendPageResponse } from '@/types/backend/sample';

let counter = 0;

export function createMockSample(
  overrides: Partial<BackendSampleResponse> = {},
): BackendSampleResponse {
  counter += 1;
  return {
    id: `sample-${counter}`,
    name: `Sample ${counter}`,
    description: `Description for sample ${counter}`,
    status: 'ACTIVE',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

export function createMockSampleList(
  count: number = 3,
  pageOverrides: Partial<BackendPageResponse<BackendSampleResponse>['page']> = {},
): BackendPageResponse<BackendSampleResponse> {
  const content = Array.from({ length: count }, () => createMockSample());
  return {
    content,
    page: {
      number: 0,
      size: 20,
      totalElements: count,
      totalPages: 1,
      ...pageOverrides,
    },
  };
}
