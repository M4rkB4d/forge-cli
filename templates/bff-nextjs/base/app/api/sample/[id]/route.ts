import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors/error-response';
import { getCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';
import { updateSampleSchema } from '@/lib/validation/sample-schema';
import { sampleClient } from '@/clients/sample-client';
import { mapSampleResponse } from '@/mappers/sample-mapper';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sample/:id — get a single sample
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const correlationId = getCorrelationId(request);
  const log = logger.child({ correlationId, route: '/api/sample/[id]' });

  try {
    const { id } = await params;

    log.info({ id }, 'Fetching sample');

    const backendResponse = await sampleClient.getById(correlationId, id);
    return Response.json(mapSampleResponse(backendResponse));
  } catch (error) {
    return handleApiError(error, correlationId, log);
  }
}

/**
 * PUT /api/sample/:id — update a sample
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const correlationId = getCorrelationId(request);
  const log = logger.child({ correlationId, route: '/api/sample/[id]' });

  try {
    const { id } = await params;
    const body = updateSampleSchema.parse(await request.json());

    log.info({ id }, 'Updating sample');

    const backendResponse = await sampleClient.update(correlationId, id, body);
    return Response.json(mapSampleResponse(backendResponse));
  } catch (error) {
    return handleApiError(error, correlationId, log);
  }
}

/**
 * DELETE /api/sample/:id — delete a sample
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const correlationId = getCorrelationId(request);
  const log = logger.child({ correlationId, route: '/api/sample/[id]' });

  try {
    const { id } = await params;

    log.info({ id }, 'Deleting sample');

    await sampleClient.remove(correlationId, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, correlationId, log);
  }
}
