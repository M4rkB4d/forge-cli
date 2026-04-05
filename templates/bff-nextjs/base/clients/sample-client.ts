import { createClient } from './base-client';
import type { BackendSampleResponse, BackendPageResponse } from '@/types/backend/sample';

const SAMPLE_SERVICE_URL = process.env.SAMPLE_SERVICE_URL ?? 'http://localhost:8080';

const client = createClient('sample-service', {
  baseURL: SAMPLE_SERVICE_URL,
});

function correlationHeaders(correlationId: string) {
  return { headers: { 'X-Correlation-Id': correlationId } };
}

export const sampleClient = {
  async list(
    correlationId: string,
    page?: number,
    size?: number,
  ): Promise<BackendPageResponse<BackendSampleResponse>> {
    const { data } = await client.get<BackendPageResponse<BackendSampleResponse>>(
      '/api/samples',
      {
        params: { page: page ?? 0, size: size ?? 20 },
        ...correlationHeaders(correlationId),
      },
    );
    return data;
  },

  async getById(
    correlationId: string,
    id: string,
  ): Promise<BackendSampleResponse> {
    const { data } = await client.get<BackendSampleResponse>(
      `/api/samples/${id}`,
      correlationHeaders(correlationId),
    );
    return data;
  },

  async create(
    correlationId: string,
    body: { name: string; description?: string },
  ): Promise<BackendSampleResponse> {
    const { data } = await client.post<BackendSampleResponse>(
      '/api/samples',
      body,
      correlationHeaders(correlationId),
    );
    return data;
  },

  async update(
    correlationId: string,
    id: string,
    body: { name?: string; description?: string },
  ): Promise<BackendSampleResponse> {
    const { data } = await client.put<BackendSampleResponse>(
      `/api/samples/${id}`,
      body,
      correlationHeaders(correlationId),
    );
    return data;
  },

  async remove(
    correlationId: string,
    id: string,
  ): Promise<void> {
    await client.delete(`/api/samples/${id}`, correlationHeaders(correlationId));
  },
};
