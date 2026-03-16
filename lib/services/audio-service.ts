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

export interface AudioProductPayload {
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

export interface CourseAudio {
  id: number;
  course_id: number;
  section_id?: number | null;
  title: string;
  slug: string;
  description?: string | null;
  playback_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ListCourseAudiosParams {
  section_id?: number;
  free_only?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateAudioPayload {
  section_id?: number | null;
  title: string;
  slug?: string;
  description?: string | null;
  playback_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: AudioProductPayload;
}

export interface UpdateAudioPayload {
  section_id?: number | null;
  title?: string;
  slug?: string;
  description?: string | null;
  playback_url?: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  language?: string | null;
  is_free_preview?: boolean;
  position?: number | null;
  product?: AudioProductPayload;
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

export const AudioService = {
  async getByCourse(
    courseId: number | string,
    params?: ListCourseAudiosParams,
  ): Promise<ApiEnvelope<CourseAudio[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ApiEnvelope<CourseAudio[]>>(
      `/courses/${courseId}/audios${query}`,
    );
    return res.data;
  },

  // Route requires modelType and id due product.access middleware:
  // GET /v1/courses/{course}/audios/{audio}/{modelType}/{id}
  async getById(
    courseId: number | string,
    audioId: number | string,
    modelType: string,
    modelId: number | string,
  ): Promise<ApiEnvelope<CourseAudio>> {
    const res = await apiClient.get<ApiEnvelope<CourseAudio>>(
      `/courses/${courseId}/audios/${audioId}/${encodeURIComponent(modelType)}/${modelId}`,
    );
    return res.data;
  },

  async create(
    courseId: number | string,
    payload: CreateAudioPayload,
  ): Promise<ApiEnvelope<CourseAudio>> {
    const res = await apiClient.post<ApiEnvelope<CourseAudio>>(
      `/courses/${courseId}/audios`,
      payload,
    );
    return res.data;
  },

  async update(
    courseId: number | string,
    audioId: number | string,
    payload: UpdateAudioPayload,
  ): Promise<ApiEnvelope<CourseAudio>> {
    const res = await apiClient.put<ApiEnvelope<CourseAudio>>(
      `/courses/${courseId}/audios/${audioId}`,
      payload,
    );
    return res.data;
  },

  async delete(
    courseId: number | string,
    audioId: number | string,
  ): Promise<ApiEnvelope<null>> {
    const res = await apiClient.delete<ApiEnvelope<null>>(
      `/courses/${courseId}/audios/${audioId}`,
    );
    return res.data;
  },
};

export default AudioService;
