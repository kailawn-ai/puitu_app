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

export interface VideoProductPayload {
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

export interface CourseVideo {
  id: number;
  course_id: number;
  section_id?: number | null;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  playback_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  captions_json?: unknown;
  drm_license_url?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ListCourseVideosParams {
  section_id?: number;
  free_only?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateVideoPayload {
  section_id?: number | null;
  title: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  playback_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  captions_json?: string | null;
  drm_license_url?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: VideoProductPayload;
}

export interface UpdateVideoPayload {
  section_id?: number | null;
  title?: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  playback_url?: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  captions_json?: string | null;
  drm_license_url?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: VideoProductPayload;
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

export const VideoService = {
  async getByCourse(
    courseId: number | string,
    params?: ListCourseVideosParams,
  ): Promise<ApiEnvelope<CourseVideo[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ApiEnvelope<CourseVideo[]>>(
      `/courses/${courseId}/videos${query}`,
    );
    return res.data;
  },

  // Route requires modelType and id due product.access middleware:
  // GET /v1/courses/{course}/videos/{video}/{modelType}/{id}
  async getById(
    courseId: number | string,
    videoId: number | string,
    modelType: string,
    modelId: number | string,
  ): Promise<ApiEnvelope<CourseVideo>> {
    const res = await apiClient.get<ApiEnvelope<CourseVideo>>(
      `/courses/${courseId}/videos/${videoId}/${encodeURIComponent(modelType)}/${modelId}`,
    );
    return res.data;
  },

  async create(
    courseId: number | string,
    payload: CreateVideoPayload,
  ): Promise<ApiEnvelope<CourseVideo>> {
    const res = await apiClient.post<ApiEnvelope<CourseVideo>>(
      `/courses/${courseId}/videos`,
      payload,
    );
    return res.data;
  },

  async update(
    courseId: number | string,
    videoId: number | string,
    payload: UpdateVideoPayload,
  ): Promise<ApiEnvelope<CourseVideo>> {
    const res = await apiClient.put<ApiEnvelope<CourseVideo>>(
      `/courses/${courseId}/videos/${videoId}`,
      payload,
    );
    return res.data;
  },

  async delete(
    courseId: number | string,
    videoId: number | string,
  ): Promise<ApiEnvelope<null>> {
    const res = await apiClient.delete<ApiEnvelope<null>>(
      `/courses/${courseId}/videos/${videoId}`,
    );
    return res.data;
  },
};

export default VideoService;
