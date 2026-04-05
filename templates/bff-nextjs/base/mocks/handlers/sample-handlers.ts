import { http, HttpResponse } from 'msw';
import { createMockSample, createMockSampleList } from '../data/sample-data';

const BACKEND_URL = process.env.SAMPLE_SERVICE_URL ?? 'http://localhost:8080';

export const sampleHandlers = [
  // GET /api/samples — list
  http.get(`${BACKEND_URL}/api/samples`, () => {
    return HttpResponse.json(createMockSampleList(3));
  }),

  // GET /api/samples/:id — single
  http.get(`${BACKEND_URL}/api/samples/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createMockSample({ id: id as string, name: `Sample ${id}` }),
    );
  }),

  // POST /api/samples — create
  http.post(`${BACKEND_URL}/api/samples`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      createMockSample({
        name: body.name as string,
        description: (body.description as string) ?? '',
      }),
      { status: 201 },
    );
  }),

  // PUT /api/samples/:id — update
  http.put(`${BACKEND_URL}/api/samples/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      createMockSample({
        id: id as string,
        name: (body.name as string) ?? 'Updated Sample',
        description: (body.description as string) ?? '',
      }),
    );
  }),

  // DELETE /api/samples/:id — delete
  http.delete(`${BACKEND_URL}/api/samples/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
