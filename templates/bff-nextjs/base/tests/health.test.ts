import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns UP status with service name', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'UP',
    });
    expect(body.service).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});
