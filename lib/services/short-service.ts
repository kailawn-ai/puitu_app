import { apiClient } from "@/lib/api/api-client";

export interface ShortUserLite {
  id: string;
  name?: string | null;
  profile_image?: string | null;
  creator_profile?: {
    id?: number;
    bio?: string | null;
    occupation?: string | null;
    is_verified?: boolean;
  } | null;
}

export interface ShortVideo {
  id: number;
  user_id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "unlisted";
  is_active: boolean;
  allow_comments: boolean;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: ShortUserLite | null;
}

export interface ShortCursorMeta {
  per_page: number;
  count: number;
  has_more: boolean;
  next_cursor?: string | null;
  pagination_type: "cursor";
}

export interface ShortInteractionState {
  short_id: number;
  liked: boolean;
  likes_count: number;
}

export interface ShortSaveState {
  short_id: number;
  saved: boolean;
}

export interface ShortViewState {
  id: number;
  views_count: number;
}

export interface ShortShareState {
  id: number;
  shares_count: number;
}

export interface ShortApiEnvelope<T> {
  status: "success" | "error";
  message: string;
  data: T;
  meta?: ShortCursorMeta;
  error?: string;
}

export interface ListShortsParams {
  scope?: "mine";
  creator_id?: string;
  status?: "draft" | "published" | "archived";
  cursor?: string;
  per_page?: number;
}

export interface CreateShortPayload {
  title: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private" | "unlisted";
  is_active?: boolean;
  allow_comments?: boolean;
}

export interface UpdateShortPayload extends Partial<CreateShortPayload> {
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
}

export interface ShortComment {
  id: number;
  short_video_id: number;
  user_id: string;
  reply_to_id?: number | null;
  body: string;
  meta?: Record<string, unknown> | null;
  likes_count?: number;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  user?: ShortUserLite | null;
  reply_to?: ShortComment | null;
  replies?: ShortComment[];
}

export interface ListShortCommentsParams {
  limit?: number;
}

export interface CreateShortCommentPayload {
  body: string;
  reply_to_id?: number | null;
  meta?: Record<string, unknown> | null;
}

export interface UpdateShortCommentPayload {
  body?: string;
  is_pinned?: boolean;
  meta?: Record<string, unknown> | null;
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

export const ShortService = {
  toEnvelope<T>(response: {
    data: T;
    message?: string;
    success?: boolean;
    meta?: ShortCursorMeta;
  }): ShortApiEnvelope<T> {
    return {
      status: response.success === false ? "error" : "success",
      message: response.message ?? "",
      data: response.data,
      meta: response.meta,
    };
  },

  async getShorts(
    params?: ListShortsParams,
  ): Promise<ShortApiEnvelope<ShortVideo[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ShortVideo[]>(`/shorts${query}`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
      meta: res.meta,
    });
  },

  async getById(shortId: number | string): Promise<ShortApiEnvelope<ShortVideo>> {
    const res = await apiClient.get<ShortVideo>(`/shorts/${shortId}`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async create(
    payload: CreateShortPayload,
  ): Promise<ShortApiEnvelope<ShortVideo>> {
    const res = await apiClient.post<ShortVideo>("/shorts", payload);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async update(
    shortId: number | string,
    payload: UpdateShortPayload,
  ): Promise<ShortApiEnvelope<ShortVideo>> {
    const res = await apiClient.put<ShortVideo>(`/shorts/${shortId}`, payload);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async delete(shortId: number | string): Promise<ShortApiEnvelope<null>> {
    const res = await apiClient.delete<null>(`/shorts/${shortId}`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async recordView(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortViewState>> {
    const res = await apiClient.post<ShortViewState>(`/shorts/${shortId}/view`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async recordShare(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortShareState>> {
    const res = await apiClient.post<ShortShareState>(`/shorts/${shortId}/share`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async getLikeStatus(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortInteractionState>> {
    const res = await apiClient.get<ShortInteractionState>(
      `/shorts/${shortId}/like-status`,
    );
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async toggleLike(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortInteractionState>> {
    const res = await apiClient.post<ShortInteractionState>(
      `/shorts/${shortId}/like`,
    );
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async getSaveStatus(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortSaveState>> {
    const res = await apiClient.get<ShortSaveState>(
      `/shorts/${shortId}/save-status`,
    );
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async toggleSave(
    shortId: number | string,
  ): Promise<ShortApiEnvelope<ShortSaveState>> {
    const res = await apiClient.post<ShortSaveState>(
      `/shorts/${shortId}/save`,
    );
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async getComments(
    shortId: number | string,
    params?: ListShortCommentsParams,
  ): Promise<ShortApiEnvelope<ShortComment[]>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<ShortComment[]>(`/shorts/${shortId}/comments${query}`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async createComment(
    shortId: number | string,
    payload: CreateShortCommentPayload,
  ): Promise<ShortApiEnvelope<ShortComment>> {
    const res = await apiClient.post<ShortComment>(`/shorts/${shortId}/comments`, payload);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async updateComment(
    commentId: number | string,
    payload: UpdateShortCommentPayload,
  ): Promise<ShortApiEnvelope<ShortComment>> {
    const res = await apiClient.put<ShortComment>(`/short-comments/${commentId}`, payload);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },

  async deleteComment(
    commentId: number | string,
  ): Promise<ShortApiEnvelope<null>> {
    const res = await apiClient.delete<null>(`/short-comments/${commentId}`);
    return this.toEnvelope({
      data: res.data,
      message: res.message,
      success: res.success,
    });
  },
};

export default ShortService;
