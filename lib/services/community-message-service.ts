import { apiClient } from "@/lib/api/api-client";
import { RealtimeDBService } from "@/lib/services/realtime-db-service";
import type {
  CommunityMessage,
  SendCommunityMessagePayload,
} from "@/lib/services/community-service";

export interface CommunityTypingState {
  typing: boolean;
  timestamp?: number | string | null;
}

export interface CommunityTypingRecord {
  [userId: string]: CommunityTypingState | null;
}

export interface CommunityRealtimeMessage extends Omit<CommunityMessage, "id"> {
  id: string;
  db_message_id?: number;
  timestamp?: number | null;
}

export interface CommunityMessageCursor {
  message_id: number;
  user_id: string;
  body?: string | null;
  message_type?: string | null;
  created_at?: string | null;
}

export interface CommunityReadState {
  group_id: number;
  user_id: string;
  last_read_at?: string | null;
}

const sortRealtimeMessages = (
  value: Record<string, Omit<CommunityRealtimeMessage, "id">> | null,
): CommunityRealtimeMessage[] => {
  if (!value) return [];

  return Object.entries(value)
    .map(([id, item]) => ({
      id,
      ...item,
    }))
    .sort((a, b) => {
      const aTimestamp =
        typeof a.timestamp === "number"
          ? a.timestamp
          : new Date(a.created_at ?? "").getTime();
      const bTimestamp =
        typeof b.timestamp === "number"
          ? b.timestamp
          : new Date(b.created_at ?? "").getTime();

      return aTimestamp - bTimestamp;
    });
};

export const CommunityMessageService = {
  async fetchMessages(
    groupId: number | string,
    params?: { limit?: number },
  ): Promise<CommunityMessage[]> {
    const query = params?.limit ? `?limit=${params.limit}` : "";
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
    isTyping: boolean,
  ): Promise<{ status: string; message?: string }> {
    const res = await apiClient.post<{ status: string; message?: string }>(
      `/community/groups/${groupId}/typing`,
      { is_typing: isTyping },
    );
    return res.data;
  },

  subscribeToRealtimeMessages(
    groupId: number | string,
    onData: (messages: CommunityRealtimeMessage[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<
      Record<string, Omit<CommunityRealtimeMessage, "id">>
    >(
      `chat/group_${groupId}/messages`,
      (value) => {
        onData(sortRealtimeMessages(value));
      },
      onError,
    );
  },

  subscribeToTyping(
    groupId: number | string,
    onData: (typing: CommunityTypingRecord) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<CommunityTypingRecord>(
      `chat/group_${groupId}/typing`,
      (value) => {
        onData(value ?? {});
      },
      onError,
    );
  },

  subscribeToLastMessageCursor(
    groupId: number | string,
    onData: (cursor: CommunityMessageCursor | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<CommunityMessageCursor>(
      `community/group_last_messages/${groupId}`,
      onData,
      onError,
    );
  },

  subscribeToReadState(
    groupId: number | string,
    userId: string,
    onData: (readState: CommunityReadState | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<CommunityReadState>(
      `community/group_reads/${groupId}/${userId}`,
      onData,
      onError,
    );
  },
};

export default CommunityMessageService;
