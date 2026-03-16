import { apiClient } from "@/lib/api/api-client";

export interface SectionCourse {
  id: number;
  title?: string;
  [key: string]: unknown;
}

export interface Section {
  id: number;
  course_id: number;
  title: string;
  position: number;
  created_at?: string;
  updated_at?: string;
  course?: SectionCourse;
  videos?: SectionVideo[];
  audios?: SectionAudio[];
  documents?: SectionDocument[];
  images?: SectionImage[];
}

export interface SectionVideo {
  id: number;
  course_id: number;
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
  captions_json?: unknown;
  drm_license_url?: string | null;
  is_free_preview?: boolean;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SectionAudio {
  id: number;
  course_id: number;
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
  position?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SectionDocument {
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
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SectionImage {
  id: number;
  course_id: number;
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
  position?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ListAllSectionsParams {
  course_id?: number;
  per_page?: number;
  page?: number;
}

export interface CreateSectionPayload {
  title: string;
  position?: number;
}

export interface UpdateSectionPayload {
  title?: string;
  position?: number;
}

export interface ReorderSectionRow {
  id: number;
  position: number;
}

export interface ReorderSectionsPayload {
  orders: ReorderSectionRow[];
}

export interface ServiceResponse<T> {
  status: number;
  message?: string;
  data: T;
  success: boolean;
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

export const SectionService = {
  async getByCourse(
    courseId: number | string,
  ): Promise<ServiceResponse<Section[]>> {
    return apiClient.get<Section[]>(`/courses/${courseId}/sections`);
  },

  async getAll(
    params?: ListAllSectionsParams,
  ): Promise<ServiceResponse<Section[]>> {
    const query = buildQueryString(params);
    return apiClient.get<Section[]>(`/sections${query}`);
  },

  async getById(
    courseId: number | string,
    sectionId: number | string,
  ): Promise<ServiceResponse<Section>> {
    return apiClient.get<Section>(`/courses/${courseId}/sections/${sectionId}`);
  },

  async create(
    courseId: number | string,
    payload: CreateSectionPayload,
  ): Promise<ServiceResponse<Section>> {
    return apiClient.post<Section>(`/courses/${courseId}/sections`, payload);
  },

  async update(
    courseId: number | string,
    sectionId: number | string,
    payload: UpdateSectionPayload,
  ): Promise<ServiceResponse<Section>> {
    return apiClient.put<Section>(
      `/courses/${courseId}/sections/${sectionId}`,
      payload,
    );
  },

  async delete(
    courseId: number | string,
    sectionId: number | string,
  ): Promise<ServiceResponse<null>> {
    return apiClient.delete<null>(`/courses/${courseId}/sections/${sectionId}`);
  },

  async reorder(
    courseId: number | string,
    payload: ReorderSectionsPayload,
  ): Promise<ServiceResponse<null>> {
    return apiClient.post<null>(
      `/courses/${courseId}/sections/reorder`,
      payload,
    );
  },
};

export default SectionService;
