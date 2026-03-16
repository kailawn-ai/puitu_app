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

export interface ImageProductPayload {
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

export interface CourseImage {
  id: number;
  course_id: number;
  section_id?: number | null;
  title: string;
  slug: string;
  description?: string | null;
  image_url: string;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ListCourseImagesParams {
  section_id?: number;
  free_only?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateImagePayload {
  section_id?: number | null;
  title: string;
  slug?: string;
  description?: string | null;
  image_url: string;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: ImageProductPayload;
}

export interface UpdateImagePayload {
  section_id?: number | null;
  title?: string;
  slug?: string;
  description?: string | null;
  image_url?: string;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: ImageProductPayload;
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

export const ImageService = {
  async getByCourse(
    courseId: number | string,
    params?: ListCourseImagesParams,
  ): Promise<ApiEnvelope<CourseImage[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ApiEnvelope<CourseImage[]>>(
      `/courses/${courseId}/images${query}`,
    );
    return res.data;
  },

  // Route requires modelType and id due product.access middleware:
  // GET /v1/courses/{course}/images/{image}/{modelType}/{id}
  async getById(
    courseId: number | string,
    imageId: number | string,
    modelType: string,
    modelId: number | string,
  ): Promise<ApiEnvelope<CourseImage>> {
    const res = await apiClient.get<ApiEnvelope<CourseImage>>(
      `/courses/${courseId}/images/${imageId}/${encodeURIComponent(modelType)}/${modelId}`,
    );
    return res.data;
  },

  async create(
    courseId: number | string,
    payload: CreateImagePayload,
  ): Promise<ApiEnvelope<CourseImage>> {
    const res = await apiClient.post<ApiEnvelope<CourseImage>>(
      `/courses/${courseId}/images`,
      payload,
    );
    return res.data;
  },

  async update(
    courseId: number | string,
    imageId: number | string,
    payload: UpdateImagePayload,
  ): Promise<ApiEnvelope<CourseImage>> {
    const res = await apiClient.put<ApiEnvelope<CourseImage>>(
      `/courses/${courseId}/images/${imageId}`,
      payload,
    );
    return res.data;
  },

  async delete(
    courseId: number | string,
    imageId: number | string,
  ): Promise<ApiEnvelope<null>> {
    const res = await apiClient.delete<ApiEnvelope<null>>(
      `/courses/${courseId}/images/${imageId}`,
    );
    return res.data;
  },
};

export default ImageService;
