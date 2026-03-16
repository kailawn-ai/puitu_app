import { apiClient } from "@/lib/api/api-client";

export type InteractionAction = "rate" | "save" | "like";

export interface CourseRating {
  id: number;
  user_id: string;
  course_id: number;
  rating: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseLike {
  id: number;
  user_id: string;
  interactable_type: "course" | "video" | "audio" | "documents" | "image";
  interactable_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseRatingSummary {
  course_id: number;
  average_rating: number;
  total_ratings: number;
  user_rating: number | null;
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
  data?: T;
  liked?: boolean;
  errors?: Record<string, string[]>;
}

export interface AdminUserPayload {
  user_id?: string;
}

export interface InteractPayload extends AdminUserPayload {
  action: InteractionAction;
  rating?: number;
}

export interface SavedRatedListParams extends AdminUserPayload {
  per_page?: number;
}

export const CourseInteractionService = {
  async rateCourse(
    courseId: number | string,
    rating: number,
  ): Promise<ApiEnvelope<CourseRating>> {
    const res = await apiClient.post(`/courses/${courseId}/rate`, { rating });
    return res.data;
  },

  async getOverallRate(
    courseId: number | string,
  ): Promise<ApiEnvelope<CourseRatingSummary>> {
    const res = await apiClient.get(`/courses/${courseId}/rating`);
    return res.data;
  },

  async toggleSave(
    courseId: number | string,
    payload?: AdminUserPayload,
  ): Promise<ApiEnvelope<unknown>> {
    const res = await apiClient.post(`/courses/${courseId}/save`, payload);
    return res.data;
  },

  async deleteSave(
    courseId: number | string,
    payload?: AdminUserPayload,
  ): Promise<ApiEnvelope<unknown>> {
    const query = payload?.user_id
      ? `?user_id=${encodeURIComponent(payload.user_id)}`
      : "";
    const res = await apiClient.delete(`/courses/${courseId}/delete${query}`);
    return res.data;
  },

  async toggleLike(
    courseId: number | string,
    payload?: AdminUserPayload,
  ): Promise<ApiEnvelope<CourseLike>> {
    const res = await apiClient.post(`/courses/${courseId}/like`, payload);
    return res.data;
  },

  async interact(
    courseId: number | string,
    payload: InteractPayload,
  ): Promise<ApiEnvelope<CourseRating | CourseLike | unknown>> {
    const res = await apiClient.post(`/courses/${courseId}/interact`, payload);
    return res.data;
  },

  async getUserSavedCourses(
    params?: SavedRatedListParams,
  ): Promise<ApiEnvelope<unknown> & { meta?: PaginationMeta }> {
    const query = new URLSearchParams();

    if (params?.per_page) {
      query.append("per_page", String(params.per_page));
    }

    if (params?.user_id) {
      query.append("user_id", params.user_id);
    }

    const queryString = query.toString();
    const res = await apiClient.get(
      `/courses/user/saved${queryString ? `?${queryString}` : ""}`,
    );

    return res.data;
  },

  async getUserRatedCourses(
    params?: SavedRatedListParams,
  ): Promise<ApiEnvelope<unknown> & { meta?: PaginationMeta }> {
    const query = new URLSearchParams();

    if (params?.per_page) {
      query.append("per_page", String(params.per_page));
    }

    if (params?.user_id) {
      query.append("user_id", params.user_id);
    }

    const queryString = query.toString();
    const res = await apiClient.get(
      `/courses/user/rated${queryString ? `?${queryString}` : ""}`,
    );

    return res.data;
  },
};
