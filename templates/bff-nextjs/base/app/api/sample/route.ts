import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors/error-response';
import { getCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';
import { paginationSchema } from '@/lib/validation/schemas';
import { createSampleSchema } from '@/lib/validation/sample-schema';
import { sampleClient } from '@/clients/sample-client';
import { mapSampleListResponse, mapSampleResponse } from '@/mappers/sample-mapper';

/**
 * GET /api/sample — list samples with pagination
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const log = logger.child({ correlationId, route: '/api/sample' });

  try {
    const { page, size } = paginationSchema.parse({
      page: request.nextUrl.searchParams.get('page') ?? undefined,
      size: request.nextUrl.searchParams.get('size') ?? undefined,
    });

    log.info({ page, size }, 'Listing samples');

    // Backend uses 0-based pages; API uses 1-based
    const backendResponse = await sampleClient.list(correlationId, page - 1, size);
    const response = mapSampleListResponse(backendResponse);

    // Adjust page back to 1-based for the consumer
    return Response.json({ ...response, page });
  } catch (error) {
    return handleApiError(error, correlationId, log);
  }
}

/**
 * POST /api/sample — create a new sample
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const log = logger.child({ correlationId, route: '/api/sample' });

  try {
    const body = createSampleSchema.parse(await request.json());

    log.info({ name: body.name }, 'Creating sample');

    const backendResponse = await sampleClient.create(correlationId, body);
    const response = mapSampleResponse(backendResponse);

    return Response.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error, correlationId, log);
  }
}
