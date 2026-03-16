import { apiClient } from "@/lib/api/api-client";

export interface Qualification {
  id: number;
  name: string;
  slug?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  category_id?: number;
}

export interface User {
  id: string; // Firebase UID or user identifier
  name?: string;
  phone?: string;
  email?: string;
  profile_image?: string;
}

export interface Section {
  id: number;
  course_id: number;
  title: string;
  position: number;
  videos_count?: number;
  documents_count?: number;
  audios_count?: number;
  images_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  subcategory_id: number;
  user_id: string;
  title: string;
  summary?: string | null;
  thumbnail_url?: string | null;
  language?: string | null;
  level?: string | null;
  is_free?: number | boolean;
  is_active?: number | boolean;
  status?: "draft" | "published" | "archived";
  approved?: number | boolean;
  price?: number | null;
  created_at?: string;
  updated_at?: string;

  sections_count?: number;
  videos_count?: number;
  documents_count?: number;
  audios_count?: number;
  images_count?: number;

  // engagement fields returned by API
  likes_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  views_count?: number;
  average_rating?: number;
  total_ratings?: number;
  user_rating?: number | null;

  user?: User | null;

  subcategory?: Subcategory;
  qualifications?: Qualification[];
  sections?: Section[];
}

export interface CourseListParams {
  subcategory_id?: number;
  category_id?: number;
  q?: string;
  status?: "draft" | "published" | "archived";
  approved?: boolean;
  is_free?: boolean;
  is_active?: boolean;
  language?: string;
  level?: string;
  qualification_id?: number;
  sort?: string;
  with?: string; // "sections,videos,qualifications"
  with_counts?: boolean;
  per_page?: number;
  page?: number;
}

export interface CoursePayload {
  subcategory_id?: number;
  user_id?: string;
  title?: string;
  summary?: string | null;
  thumbnail_url?: string | null;
  language?: string | null;
  level?: string | null;
  is_free?: boolean;
  is_active?: boolean;
  status?: "draft" | "published" | "archived";
  approved?: boolean;
  price?: number | null;
  qualification_ids?: number[];
}

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
  qualification?: {
    id: number;
    name: string;
    slug?: string;
  };
  error?: string;
}

export const CourseService = {
  async getCourses(params?: CourseListParams): Promise<ApiEnvelope<Course[]>> {
    const res = await apiClient.get("/courses", { params });
    return res.data;
  },

  async getCourseById(
    id: number | string,
    withRelations?: string,
  ): Promise<ApiEnvelope<Course>> {
    const res = await apiClient.get(`/courses/${id}`, {
      params: withRelations ? { with: withRelations } : undefined,
    });
    return res.data;
  },

  async createCourse(payload: CoursePayload): Promise<ApiEnvelope<Course>> {
    const res = await apiClient.post("/courses", payload);
    return res.data;
  },

  async updateCourse(
    id: number | string,
    payload: CoursePayload,
  ): Promise<ApiEnvelope<Course>> {
    const res = await apiClient.put(`/courses/${id}`, payload);
    return res.data;
  },

  async deleteCourse(id: number | string): Promise<ApiEnvelope<null>> {
    const res = await apiClient.delete(`/courses/${id}`);
    return res.data;
  },

  async addQualifications(
    id: number | string,
    qualification_ids: number[],
  ): Promise<ApiEnvelope<Course>> {
    const res = await apiClient.post(`/courses/${id}/qualifications`, {
      qualification_ids,
    });
    return res.data;
  },

  async removeQualifications(
    id: number | string,
    qualification_ids: number[],
  ): Promise<ApiEnvelope<Course>> {
    const res = await apiClient.delete(`/courses/${id}/qualifications`, {
      data: { qualification_ids },
    });
    return res.data;
  },

  async getCoursesByQualification(
    qualificationId: number | string,
    params?: {
      is_active?: boolean;
      status?: "draft" | "published" | "archived";
      sort?: string;
      per_page?: number;
      page?: number;
    },
  ): Promise<ApiEnvelope<Course[]>> {
    const res = await apiClient.get(
      `/courses/by-qualification/${qualificationId}`,
      { params },
    );
    return res.data;
  },
};
