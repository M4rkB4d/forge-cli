import type { BackendSampleResponse, BackendPageResponse } from '@/types/backend/sample';
import type { SampleItem, SampleListResponse } from '@/types/api/sample';

export function mapSampleResponse(backend: BackendSampleResponse): SampleItem {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    status: backend.status,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
  };
}

export function mapSampleListResponse(
  backend: BackendPageResponse<BackendSampleResponse>,
): SampleListResponse {
  return {
    items: backend.content.map(mapSampleResponse),
    page: backend.page.number,
    size: backend.page.size,
    totalElements: backend.page.totalElements,
    totalPages: backend.page.totalPages,
  };
}
