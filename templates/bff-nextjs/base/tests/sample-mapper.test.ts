import { describe, it, expect } from 'vitest';
import { mapSampleResponse, mapSampleListResponse } from '@/mappers/sample-mapper';
import type { BackendSampleResponse, BackendPageResponse } from '@/types/backend/sample';

describe('mapSampleResponse', () => {
  it('transforms backend shape to API shape', () => {
    const backend: BackendSampleResponse = {
      id: 'abc-123',
      name: 'Test Sample',
      description: 'A test description',
      status: 'ACTIVE',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    };

    const result = mapSampleResponse(backend);

    expect(result).toEqual({
      id: 'abc-123',
      name: 'Test Sample',
      description: 'A test description',
      status: 'ACTIVE',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    });
  });

  it('handles null description as-is', () => {
    const backend: BackendSampleResponse = {
      id: 'abc-123',
      name: 'No Desc',
      description: null as unknown as string,
      status: 'DRAFT',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    };

    const result = mapSampleResponse(backend);
    expect(result.description).toBeNull();
  });
});

describe('mapSampleListResponse', () => {
  it('transforms paged response', () => {
    const backend: BackendPageResponse<BackendSampleResponse> = {
      content: [
        {
          id: '1',
          name: 'First',
          description: 'First desc',
          status: 'ACTIVE',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          id: '2',
          name: 'Second',
          description: 'Second desc',
          status: 'DRAFT',
          createdAt: '2025-01-15T11:00:00Z',
          updatedAt: '2025-01-15T11:00:00Z',
        },
      ],
      page: {
        number: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    };

    const result = mapSampleListResponse(backend);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('1');
    expect(result.items[1].id).toBe('2');
    expect(result.page).toBe(0);
    expect(result.size).toBe(20);
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it('handles empty content array', () => {
    const backend: BackendPageResponse<BackendSampleResponse> = {
      content: [],
      page: {
        number: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      },
    };

    const result = mapSampleListResponse(backend);

    expect(result.items).toEqual([]);
    expect(result.totalElements).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
