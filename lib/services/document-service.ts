import { apiClient } from "@/lib/api/api-client";

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiEnvelope<T> {
  status: "success" | "error";
  message: string;
  data: T;
  meta?: PaginationMeta;
  error?: string;
}

export interface DocumentProductPayload {
  name?: string;
  description?: string | null;
  price?: number;
  allow_points?: boolean;
  points_price?: number | null;
  discount_price?: number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number;
  access_duration_days?: number | null;
  category?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CourseDocument {
  id: number;
  course_id: number;
  section_id?: number | null;
  title: string;
  slug?: string;
  description?: string | null;
  file_url: string;
  pages?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ListCourseDocumentsParams {
  section_id?: number;
  free_only?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateDocumentPayload {
  section_id?: number | null;
  title: string;
  description?: string | null;
  file_url: string;
  pages?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: DocumentProductPayload;
}

export interface UpdateDocumentPayload {
  section_id?: number | null;
  title?: string;
  description?: string | null;
  file_url?: string;
  pages?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: DocumentProductPayload;
}

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return "";

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const DocumentService = {
  async getByCourse(
    courseId: number | string,
    params?: ListCourseDocumentsParams,
  ): Promise<ApiEnvelope<CourseDocument[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ApiEnvelope<CourseDocument[]>>(
      `/courses/${courseId}/documents${query}`,
    );
    return res.data;
  },

  // Route requires modelType and id due product.access middleware:
  // GET /v1/courses/{course}/documents/{document}/{modelType}/{id}
  async getById(
    courseId: number | string,
    documentId: number | string,
    modelType: string,
    modelId: number | string,
  ): Promise<ApiEnvelope<CourseDocument>> {
    const res = await apiClient.get<ApiEnvelope<CourseDocument>>(
      `/courses/${courseId}/documents/${documentId}/${encodeURIComponent(modelType)}/${modelId}`,
    );
    return res.data;
  },

  async create(
    courseId: number | string,
    payload: CreateDocumentPayload,
  ): Promise<ApiEnvelope<CourseDocument>> {
    const res = await apiClient.post<ApiEnvelope<CourseDocument>>(
      `/courses/${courseId}/documents`,
      payload,
    );
    return res.data;
  },

  async update(
    courseId: number | string,
    documentId: number | string,
    payload: UpdateDocumentPayload,
  ): Promise<ApiEnvelope<CourseDocument>> {
    const res = await apiClient.put<ApiEnvelope<CourseDocument>>(
      `/courses/${courseId}/documents/${documentId}`,
      payload,
    );
    return res.data;
  },

  async delete(
    courseId: number | string,
    documentId: number | string,
  ): Promise<ApiEnvelope<null>> {
    const res = await apiClient.delete<ApiEnvelope<null>>(
      `/courses/${courseId}/documents/${documentId}`,
    );
    return res.data;
  },
};

export default DocumentService;
