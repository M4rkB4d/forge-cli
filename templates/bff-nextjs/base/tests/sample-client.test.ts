import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { sampleClient } from '@/clients/sample-client';
import { createMockSample, createMockSampleList } from '@/mocks/data/sample-data';

const BACKEND_URL = process.env.SAMPLE_SERVICE_URL ?? 'http://localhost:8080';
const CORRELATION_ID = 'test-correlation-id';

describe('sampleClient', () => {
  describe('list', () => {
    it('returns a typed page response', async () => {
      const mockData = createMockSampleList(2);

      server.use(
        http.get(`${BACKEND_URL}/api/samples`, () => {
          return HttpResponse.json(mockData);
        }),
      );

      const result = await sampleClient.list(CORRELATION_ID, 0, 20);

      expect(result.content).toHaveLength(2);
      expect(result.page.totalElements).toBe(2);
    });
  });

  describe('getById', () => {
    it('returns a single sample', async () => {
      const mockSample = createMockSample({ id: 'get-123', name: 'Found' });

      server.use(
        http.get(`${BACKEND_URL}/api/samples/get-123`, () => {
          return HttpResponse.json(mockSample);
        }),
      );

      const result = await sampleClient.getById(CORRELATION_ID, 'get-123');

      expect(result.id).toBe('get-123');
      expect(result.name).toBe('Found');
    });

    it('propagates 404 as an error', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/samples/missing`, () => {
          return HttpResponse.json(
            { errorCode: 'SAMPLE-001', detail: 'Not found' },
            { status: 404 },
          );
        }),
      );

      await expect(sampleClient.getById(CORRELATION_ID, 'missing')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('returns the created sample', async () => {
      const mockSample = createMockSample({ name: 'New Sample' });

      server.use(
        http.post(`${BACKEND_URL}/api/samples`, () => {
          return HttpResponse.json(mockSample, { status: 201 });
        }),
      );

      const result = await sampleClient.create(CORRELATION_ID, {
        name: 'New Sample',
      });

      expect(result.name).toBe('New Sample');
    });
  });

  describe('error handling', () => {
    it('propagates 500 errors', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/samples`, () => {
          return HttpResponse.json(
            { errorCode: 'SYS-001', detail: 'Internal error' },
            { status: 500 },
          );
        }),
      );

      await expect(sampleClient.list(CORRELATION_ID)).rejects.toThrow();
    });
  });
});
