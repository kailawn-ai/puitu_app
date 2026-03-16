import { apiClient } from "@/lib/api/api-client";
import { RealtimeDBService } from "@/lib/services/realtime-db-service";
import { NotificationItem, NotificationKind } from "@/components/notification/noti-card-ui";

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

type NotificationMap = Record<string, RawNotificationRecord> | null;
type NotificationCollection = NotificationMap | RawNotificationRecord[] | null;

const pathByType: Record<string, string> = {
  course: "/course",
  new_course: "/course",
  job: "/job",
  old_question: "/old-question",
  oldquestion: "/old-question",
};

const supportedInternalPaths = ["/course/", "/job/", "/old-question/"];

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

const buildRouteFromType = (
  type: string | null | undefined,
  id: string | number | null | undefined,
): string | null => {
  if (!type || id === null || id === undefined || id === "") return null;

  const normalizedType = type.toLowerCase();
  const basePath = pathByType[normalizedType];

  if (!basePath) return null;

  return `${basePath}/${id}`;
};

const buildRoute = (item: RawNotificationRecord): string | null => {
  const routeFromData = getString(item.data?.route, item.data?.path, item.data?.screen);
  if (
    routeFromData &&
    supportedInternalPaths.some((path) => routeFromData.startsWith(path))
  ) {
    return routeFromData;
  }

  const actionUrl = item.action_url?.trim();
  if (actionUrl) {
    const match = actionUrl.match(/^[a-z]+:\/\/([^/]+)\/(.+)$/i);
    if (match) {
      return `/${match[1]}/${match[2]}`;
    }
  }

  const directLink = item.link?.trim();
  if (
    directLink &&
    supportedInternalPaths.some((path) => directLink.startsWith(path))
  ) {
    return directLink;
  }

  const candidates: Array<[string | null | undefined, string | number | null | undefined]> = [
    [item.content_type, item.content_id],
    [item.reference_type, item.reference_id],
    [typeof item.data?.content_type === "string" ? item.data.content_type : null, item.data?.content_id as string | number | null | undefined],
    [typeof item.data?.reference_type === "string" ? item.data.reference_type : null, item.data?.reference_id as string | number | null | undefined],
    [item.type, item.data?.course_id as string | number | null | undefined],
    [item.type, item.data?.job_id as string | number | null | undefined],
    [item.type, item.data?.old_question_id as string | number | null | undefined],
  ];

  for (const [type, id] of candidates) {
    const route = buildRouteFromType(type, id);
    if (route) return route;
  }

  return null;
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

export const NotificationService = {
  async fetchUserNotifications(): Promise<AppNotificationItem[]> {
    const response = await apiClient.get<RawNotificationRecord[]>("/notifications");
    return normalizeItems(response.data);
  },

  subscribeToUserNotifications(
    userId: string,
    onData: (items: AppNotificationItem[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return RealtimeDBService.subscribe<Record<string, RawNotificationRecord>>(
      `notifications/${userId}`,
      (value) => {
        onData(normalizeItems(value));
      },
      onError,
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
