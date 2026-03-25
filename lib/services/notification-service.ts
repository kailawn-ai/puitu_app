import { apiClient } from "@/lib/api/api-client";
import { RealtimeDBService } from "@/lib/services/realtime-db-service";
import { getStoredAuthUser } from "@/lib/utils/auth-user-store";
import { NotificationItem, NotificationKind } from "@/components/notification/noti-card-ui";
import { resolveNotificationRoute } from "@/lib/utils/notification-routing";
import { getAuth } from "@react-native-firebase/auth";

export interface RawNotificationRecord {
  id?: string | number;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
  image?: string | null;
  link?: string | null;
  action_url?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  created_at?: string | null;
  timestamp?: number | null;
  reference_type?: string | null;
  reference_id?: string | number | null;
  content_type?: string | null;
  content_id?: string | number | null;
}

export interface AppNotificationItem extends NotificationItem {
  rawType?: string | null;
  actionUrl?: string | null;
  link?: string | null;
  image?: string | null;
  route?: string | null;
  createdAt?: string | null;
  readAt?: string | null;
}

export interface NotificationPaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  last_page_url?: string | null;
  next_page_url?: string | null;
  path?: string | null;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

type NotificationMap = Record<string, RawNotificationRecord> | null;
type NotificationCollection = NotificationMap | RawNotificationRecord[] | null;
type NotificationApiResponse =
  | RawNotificationRecord[]
  | NotificationPaginatedResponse<RawNotificationRecord>;

const resolveNotificationUserId = async (): Promise<string | null> => {
  const authUserId = getAuth().currentUser?.uid;
  if (authUserId) {
    return authUserId;
  }

  const storedUser = await getStoredAuthUser();
  return storedUser?.id ?? null;
};

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

const toArray = (value: NotificationCollection): RawNotificationRecord[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item, index) => ({
      ...item,
      id: item?.id ?? index,
    }));
  }

  return Object.entries(value).map(([key, item]) => ({
    ...item,
    id: item?.id ?? key,
  }));
};

const getString = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const getDateValue = (item: RawNotificationRecord): number => {
  if (item.created_at) {
    const parsed = Date.parse(item.created_at);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (typeof item.timestamp === "number") {
    return item.timestamp;
  }

  return 0;
};

const getKind = (item: RawNotificationRecord): NotificationKind => {
  const source = String(
    item.content_type ??
      item.reference_type ??
      item.data?.content_type ??
      item.data?.reference_type ??
      item.type ??
      "general",
  ).toLowerCase();

  if (source.includes("job")) return "job";
  if (
    source.includes("course") ||
    source.includes("quiz") ||
    source.includes("content")
  ) {
    return "course";
  }

  return "general";
};

const buildRoute = (item: RawNotificationRecord): string | null => {
  return resolveNotificationRoute({
    type: item.type,
    action_url: item.action_url,
    link: item.link,
    content_type: item.content_type,
    content_id: item.content_id,
    reference_type: item.reference_type,
    reference_id: item.reference_id,
    route: item.data?.route as string | undefined,
    path: item.data?.path as string | undefined,
    screen: item.data?.screen as string | undefined,
    course_id: item.data?.course_id as string | number | undefined,
    job_id: item.data?.job_id as string | number | undefined,
    old_question_id: item.data?.old_question_id as string | number | undefined,
  });
};

const normalizeItems = (
  value: NotificationCollection,
): AppNotificationItem[] => {
  return toArray(value)
    .sort((a, b) => getDateValue(b) - getDateValue(a))
    .map(mapNotification);
};

const formatTimeLabel = (value: RawNotificationRecord): string => {
  const timestamp = getDateValue(value);
  if (!timestamp) return "Just now";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

const mapNotification = (item: RawNotificationRecord): AppNotificationItem => ({
  id: String(item.id ?? ""),
  title: getString(item.title, item.data?.title) || "Notification",
  body:
    getString(
      item.body,
      item.data?.body,
      item.data?.message,
      item.data?.description,
    ) || "You have a new update.",
  timeLabel: formatTimeLabel(item),
  kind: getKind(item),
  unread: !item.is_read,
  rawType: item.type,
  actionUrl: item.action_url ?? null,
  link: item.link ?? null,
  image: item.image ?? null,
  route: buildRoute(item),
  createdAt: item.created_at ?? null,
  readAt: item.read_at ?? null,
});

const isPaginatedNotificationResponse = (
  value: NotificationApiResponse,
): value is NotificationPaginatedResponse<RawNotificationRecord> => {
  return !Array.isArray(value) && Array.isArray(value?.data);
};

const isPermissionDeniedError = (error: unknown): boolean => {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  return (
    code === "database/permission-denied" ||
    message.toLowerCase().includes("permission-denied")
  );
};

const fetchNotificationsFromApi = async (
  params?: {
    page?: number;
    per_page?: number;
  },
): Promise<NotificationPaginatedResponse<AppNotificationItem>> => {
  const query = buildQueryString({
    page: params?.page,
    per_page: params?.per_page,
  });
  const response = await apiClient.get<NotificationApiResponse>(
    `/notifications${query}`,
  );
  const payload = response.data;

  if (isPaginatedNotificationResponse(payload)) {
    return {
      ...payload,
      data: normalizeItems(payload.data),
    };
  }

  const items = normalizeItems(payload);
  const currentPage = params?.page ?? 1;
  const perPage = params?.per_page ?? Math.max(items.length, 1);

  return {
    current_page: currentPage,
    data: items,
    last_page: currentPage,
    per_page: perPage,
    total: items.length,
    next_page_url: null,
  };
};

export const NotificationService = {
  async fetchUserNotifications(): Promise<AppNotificationItem[]> {
    const response = await this.fetchUserNotificationsPage();
    return response.data;
  },

  async fetchUserNotificationsPage(params?: {
    page?: number;
    per_page?: number;
  }): Promise<NotificationPaginatedResponse<AppNotificationItem>> {
    const userId = await resolveNotificationUserId();
    if (!userId) {
      return {
        current_page: params?.page ?? 1,
        data: [],
        last_page: 1,
        per_page: params?.per_page ?? 20,
        total: 0,
        next_page_url: null,
      };
    }

    try {
      const payload = await RealtimeDBService.get<NotificationMap>(
        `notifications/${userId}`,
      );

      const items = normalizeItems(payload);
      const currentPage = params?.page ?? 1;
      const perPage = params?.per_page ?? Math.max(items.length, 1);
      const start = (currentPage - 1) * perPage;
      const pagedItems = items.slice(start, start + perPage);
      const lastPage = Math.max(1, Math.ceil(items.length / perPage));

      return {
        current_page: currentPage,
        data: pagedItems,
        last_page: lastPage,
        per_page: perPage,
        total: items.length,
        next_page_url: currentPage < lastPage ? String(currentPage + 1) : null,
      };
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
    }

    return fetchNotificationsFromApi(params);
  },

  subscribeToUserNotifications(
    options: {
      qualificationIds: Array<number | string>;
      userId?: string | null;
    },
    onSignal: () => void,
    onError?: (error: Error) => void,
  ): () => void {
    const { userId } = options;
    const unsubscribes: Array<() => void> = [];
    const subscribedPaths = new Set<string>();
    const eventTypes = ["value", "child_added", "child_changed", "child_removed"] as const;

    const subscribePath = (path: string) => {
      if (subscribedPaths.has(path)) {
        return;
      }

      subscribedPaths.add(path);

      eventTypes.forEach((eventType) => {
        unsubscribes.push(
          RealtimeDBService.subscribe<Record<string, unknown>>(
            path,
            () => {
              onSignal();
            },
            (error) => {
              if (isPermissionDeniedError(error)) {
                return;
              }

              onError?.(error);
            },
            eventType,
          ),
        );
      });
    };

    if (userId) {
      subscribePath(`notifications/${userId}`);
      subscribePath(`user_notifications/${userId}`);
    }

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  },

  subscribeToRealtimeNotificationItems(
    userId: string,
    onItems: (items: AppNotificationItem[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<NotificationMap>(
      `notifications/${userId}`,
      (value) => {
        onItems(normalizeItems(value));
      },
      (error) => {
        if (isPermissionDeniedError(error)) {
          onError?.(error);
          return;
        }

        onError?.(error);
      },
      "value",
    );
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post("/notifications/read-all");
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
