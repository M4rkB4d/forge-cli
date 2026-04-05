import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the client module before imports
vi.mock('@/clients/sample-client', () => ({
  sampleClient: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock the logger to avoid pino side effects
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { GET, POST } from '@/app/api/sample/route';
import { GET as GET_BY_ID } from '@/app/api/sample/[id]/route';
import { sampleClient } from '@/clients/sample-client';
import type { BackendSampleResponse, BackendPageResponse } from '@/types/backend/sample';

const mockedClient = vi.mocked(sampleClient);

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const mockBackendSample: BackendSampleResponse = {
  id: 'sample-1',
  name: 'Test Sample',
  description: 'A description',
  status: 'ACTIVE',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const mockBackendPage: BackendPageResponse<BackendSampleResponse> = {
  content: [mockBackendSample],
  page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/sample', () => {
  it('returns paginated list of samples', async () => {
    mockedClient.list.mockResolvedValue(mockBackendPage);

    const request = createRequest('/api/sample?page=1&size=20');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe('sample-1');
    expect(body.page).toBe(1);
    expect(body.totalElements).toBe(1);
  });

  it('defaults to page 1, size 20', async () => {
    mockedClient.list.mockResolvedValue(mockBackendPage);

    const request = createRequest('/api/sample');
    await GET(request);

    // Backend receives 0-based page
    expect(mockedClient.list).toHaveBeenCalledWith(
      expect.any(String),
      0,
      20,
    );
  });
});

describe('POST /api/sample', () => {
  it('creates a sample and returns 201', async () => {
    mockedClient.create.mockResolvedValue(mockBackendSample);

    const request = createRequest('/api/sample', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Sample', description: 'A description' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe('sample-1');
    expect(body.name).toBe('Test Sample');
  });

  it('returns 400 for invalid body (missing name)', async () => {
    const request = createRequest('/api/sample', {
      method: 'POST',
      body: JSON.stringify({ description: 'No name provided' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe('VAL-001');
    expect(body.violations).toBeDefined();
    expect(body.violations.length).toBeGreaterThan(0);
  });

  it('returns 400 for empty name', async () => {
    const request = createRequest('/api/sample', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

describe('GET /api/sample/[id]', () => {
  it('returns a single sample by id', async () => {
    mockedClient.getById.mockResolvedValue(mockBackendSample);

    const request = createRequest('/api/sample/sample-1');
    const response = await GET_BY_ID(request, {
      params: Promise.resolve({ id: 'sample-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('sample-1');
    expect(body.name).toBe('Test Sample');
  });
});
