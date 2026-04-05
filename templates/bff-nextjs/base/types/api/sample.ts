export interface SampleItem {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SampleListResponse {
  items: SampleItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateSampleRequest {
  name: string;
  description?: string;
}

export interface UpdateSampleRequest {
  name?: string;
  description?: string;
}
