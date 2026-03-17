import { apiClient } from "@/lib/api/api-client";

export interface CommunityUserLite {
  id: string;
  name?: string | null;
  profile_image?: string | null;
}

export interface CommunityGroupMember {
  id: number;
  group_id: number;
  user_id: string;
  role: "owner" | "admin" | "member";
  status: "active" | "left" | "removed";
  joined_at?: string | null;
  last_read_at?: string | null;
  muted_until?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: CommunityUserLite | null;
}

export interface CommunityGroup {
  id: number;
  owner_user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatar_url?: string | null;
  is_private: boolean;
  max_members: number;
  settings?: Record<string, unknown> | null;
  last_message_at?: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: CommunityUserLite | null;
  active_members?: CommunityGroupMember[];
  members_count?: number;
}

export interface CommunityMessageAttachment {
  id: number;
  message_id: number;
  disk: string;
  path: string;
  url?: string | null;
  original_name: string;
  mime_type?: string | null;
  size: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityMessage {
  id: number;
  group_id: number;
  user_id: string;
  reply_to_id?: number | null;
  message_type: "text" | "file" | "mixed";
  body?: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  user?: CommunityUserLite | null;
  reply_to?: CommunityMessage | null;
  attachments?: CommunityMessageAttachment[];
}

export interface CommunityQuizOption {
  id: number;
  option_text?: string | null;
  text?: string | null;
  is_correct?: boolean;
  order?: number | null;
}

export interface CommunityQuizQuestion {
  id: number;
  quiz_id: number;
  question?: string | null;
  text?: string | null;
  order?: number | null;
  points?: number | null;
  options?: CommunityQuizOption[];
}

export interface CommunityQuizLite {
  id: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  questions?: CommunityQuizQuestion[];
}

export interface CommunityQuizParticipant {
  id: number;
  session_id: number;
  user_id: string;
  status: "joined" | "submitted";
  score: number;
  correct_answers: number;
  answered_questions: number;
  joined_at?: string | null;
  submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: CommunityUserLite | null;
}

export interface CommunityQuizSession {
  id: number;
  group_id: number;
  quiz_id: number;
  host_user_id: string;
  status: "lobby" | "live" | "ended";
  title?: string | null;
  settings?: Record<string, unknown> | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  updated_at?: string;
  quiz?: CommunityQuizLite | null;
  host?: CommunityUserLite | null;
  group?: Pick<CommunityGroup, "id" | "name" | "slug"> | null;
  participants?: CommunityQuizParticipant[];
  participants_count?: number;
}

export interface CommunityPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page: number;
  last_page_url?: string;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

export interface CreateCommunityGroupPayload {
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
  max_members?: number;
  settings?: Record<string, unknown>;
}

export interface UpdateCommunityGroupPayload {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
  max_members?: number;
  settings?: Record<string, unknown>;
}

export interface AddCommunityMemberPayload {
  user_id: string;
  role?: "admin" | "member";
}

export interface SendCommunityMessagePayload {
  body?: string;
  reply_to_id?: number;
  meta?: Record<string, unknown>;
}

export interface SetCommunityTypingPayload {
  is_typing: boolean;
}

export interface CreateCommunityQuizSessionPayload {
  quiz_id: number;
  title?: string;
  settings?: Record<string, unknown>;
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

export const CommunityService = {
  async getGroups(params?: {
    per_page?: number;
  }): Promise<CommunityPaginatedResponse<CommunityGroup>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<CommunityPaginatedResponse<CommunityGroup>>(
      `/community/groups${query}`,
    );
    return res.data;
  },

  async getMyGroups(): Promise<CommunityGroup[]> {
    const res = await apiClient.get<CommunityGroup[]>("/community/groups/my");
    return res.data;
  },

  async getGroupById(groupId: number | string): Promise<CommunityGroup> {
    const res = await apiClient.get<CommunityGroup>(`/community/groups/${groupId}`);
    return res.data;
  },

  async createGroup(
    payload: CreateCommunityGroupPayload,
  ): Promise<CommunityGroup> {
    const res = await apiClient.post<CommunityGroup>("/community/groups", payload);
    return res.data;
  },

  async updateGroup(
    groupId: number | string,
    payload: UpdateCommunityGroupPayload,
  ): Promise<CommunityGroup> {
    const res = await apiClient.put<CommunityGroup>(
      `/community/groups/${groupId}`,
      payload,
    );
    return res.data;
  },

  async joinGroup(groupId: number | string): Promise<CommunityGroupMember> {
    const res = await apiClient.post<CommunityGroupMember>(
      `/community/groups/${groupId}/join`,
    );
    return res.data;
  },

  async leaveGroup(groupId: number | string): Promise<{
    status: string;
    message?: string;
  }> {
    const res = await apiClient.post<{ status: string; message?: string }>(
      `/community/groups/${groupId}/leave`,
    );
    return res.data;
  },

  async addMember(
    groupId: number | string,
    payload: AddCommunityMemberPayload,
  ): Promise<CommunityGroupMember> {
    const res = await apiClient.post<CommunityGroupMember>(
      `/community/groups/${groupId}/members`,
      payload,
    );
    return res.data;
  },

  async removeMember(
    groupId: number | string,
    userId: string,
  ): Promise<{ status: string; message?: string }> {
    const res = await apiClient.delete<{ status: string; message?: string }>(
      `/community/groups/${groupId}/members/${userId}`,
    );
    return res.data;
  },

  async getMessages(
    groupId: number | string,
    params?: { limit?: number },
  ): Promise<CommunityMessage[]> {
    const query = buildQueryString(params);
    const res = await apiClient.get<CommunityMessage[]>(
      `/community/groups/${groupId}/messages${query}`,
    );
    return res.data;
  },

  async sendMessage(
    groupId: number | string,
    payload: SendCommunityMessagePayload,
  ): Promise<CommunityMessage> {
    const res = await apiClient.post<CommunityMessage>(
      `/community/groups/${groupId}/messages`,
      payload,
    );
    return res.data;
  },

  async sendMessageWithAttachment(
    groupId: number | string,
    fileUri: string,
    options?: {
      body?: string;
      reply_to_id?: number;
    },
  ): Promise<CommunityMessage> {
    const res = await apiClient.uploadFile<CommunityMessage>(
      `/community/groups/${groupId}/messages`,
      fileUri,
      "attachments[]",
      {
        ...(options?.body ? { body: options.body } : {}),
        ...(options?.reply_to_id
          ? { reply_to_id: String(options.reply_to_id) }
          : {}),
      },
    );
    return res.data;
  },

  async setTyping(
    groupId: number | string,
    payload: SetCommunityTypingPayload,
  ): Promise<{ status: string; message?: string }> {
    const res = await apiClient.post<{ status: string; message?: string }>(
      `/community/groups/${groupId}/typing`,
      payload,
    );
    return res.data;
  },

  async getQuizSessions(
    groupId: number | string,
  ): Promise<CommunityQuizSession[]> {
    const res = await apiClient.get<CommunityQuizSession[]>(
      `/community/groups/${groupId}/quiz-sessions`,
    );
    return res.data;
  },

  async createQuizSession(
    groupId: number | string,
    payload: CreateCommunityQuizSessionPayload,
  ): Promise<CommunityQuizSession> {
    const res = await apiClient.post<CommunityQuizSession>(
      `/community/groups/${groupId}/quiz-sessions`,
      payload,
    );
    return res.data;
  },

  async getQuizSessionById(
    sessionId: number | string,
  ): Promise<CommunityQuizSession> {
    const res = await apiClient.get<CommunityQuizSession>(
      `/community/quiz-sessions/${sessionId}`,
    );
    return res.data;
  },

  async joinQuizSession(
    sessionId: number | string,
  ): Promise<CommunityQuizParticipant> {
    const res = await apiClient.post<CommunityQuizParticipant>(
      `/community/quiz-sessions/${sessionId}/join`,
    );
    return res.data;
  },

  async startQuizSession(
    sessionId: number | string,
  ): Promise<CommunityQuizSession> {
    const res = await apiClient.post<CommunityQuizSession>(
      `/community/quiz-sessions/${sessionId}/start`,
    );
    return res.data;
  },
};

export default CommunityService;
