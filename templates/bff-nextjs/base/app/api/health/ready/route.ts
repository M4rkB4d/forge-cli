import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'ok' | 'fail';
  latencyMs?: number;
  message?: string;
}

async function checkDownstream(url: string, label: string): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5_000),
    });
    const latencyMs = Date.now() - start;
    return response.ok
      ? { status: 'ok', latencyMs }
      : { status: 'fail', latencyMs, message: `${label} returned ${response.status}` };
  } catch (error) {
    return {
      status: 'fail',
      latencyMs: Date.now() - start,
      message: `${label} unreachable: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }
}

export async function GET() {
  const sampleServiceUrl = process.env.SAMPLE_SERVICE_URL ?? 'http://localhost:8080';

  const checks: Record<string, HealthCheck> = {
    sampleService: await checkDownstream(`${sampleServiceUrl}/health`, 'sample-service'),
  };

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
