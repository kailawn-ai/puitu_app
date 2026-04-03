import * as SecureStore from "expo-secure-store";

export const AUTH_USER_STORE_KEYS = {
  AUTH_USER_JSON: "auth_user_json",
  AUTH_EMAIL: "auth_email",
  AUTH_PHONE: "auth_phone",
  AUTH_NAME: "auth_name",
  AUTH_IMAGE: "auth_image",
  AUTH_PROVIDER: "auth_provider",
  AUTH_POINTS: "auth_points",
} as const;

export interface StoredAuthUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image?: string | null;
  provider?: "email" | "google" | "phone" | "system";
  country?: string | null;
  state?: string | null;
  district?: string | null;
  town?: string | null;
  points?: number;
  is_active?: boolean;
  updated_at?: string;
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const mapToStoredUser = (
  user?: Record<string, unknown> | null,
  provider?: StoredAuthUser["provider"],
): StoredAuthUser | null => {
  if (!user) return null;

  const mapped: StoredAuthUser = {
    id: (user.id as string) ?? null,
    name: (user.name as string) ?? null,
    email: (user.email as string) ?? null,
    phone: (user.phone as string) ?? null,
    profile_image:
      (user.profile_image as string) ?? (user.image as string) ?? null,
    provider: provider ?? "system",
    country: (user.country as string) ?? null,
    state: (user.state as string) ?? null,
    district: (user.district as string) ?? null,
    town: (user.town as string) ?? null,
    points:
      toNumberOrNull(user.points) ?? toNumberOrNull(user.available_points) ?? 0,
    is_active:
      typeof user.is_active === "boolean"
        ? user.is_active
        : user.is_active === 1,
    updated_at: new Date().toISOString(),
  };

  return mapped;
};

export const saveAuthUserToStore = async (
  user?: Record<string, unknown> | null,
  provider?: StoredAuthUser["provider"],
) => {
  const mapped = mapToStoredUser(user, provider);
  if (!mapped) return;

  const tasks: Promise<void>[] = [];

  tasks.push(
    SecureStore.setItemAsync(
      AUTH_USER_STORE_KEYS.AUTH_USER_JSON,
      JSON.stringify(mapped),
    ),
  );

  if (mapped.email) {
    tasks.push(
      SecureStore.setItemAsync(AUTH_USER_STORE_KEYS.AUTH_EMAIL, mapped.email),
    );
  }
  if (mapped.phone) {
    tasks.push(
      SecureStore.setItemAsync(AUTH_USER_STORE_KEYS.AUTH_PHONE, mapped.phone),
    );
  }
  if (mapped.name) {
    tasks.push(
      SecureStore.setItemAsync(AUTH_USER_STORE_KEYS.AUTH_NAME, mapped.name),
    );
  }
  if (mapped.profile_image) {
    tasks.push(
      SecureStore.setItemAsync(
        AUTH_USER_STORE_KEYS.AUTH_IMAGE,
        mapped.profile_image,
      ),
    );
  }
  if (mapped.provider) {
    tasks.push(
      SecureStore.setItemAsync(
        AUTH_USER_STORE_KEYS.AUTH_PROVIDER,
        mapped.provider,
      ),
    );
  }
  tasks.push(
    SecureStore.setItemAsync(
      AUTH_USER_STORE_KEYS.AUTH_POINTS,
      String(mapped.points ?? 0),
    ),
  );

  await Promise.all(tasks);
};

export const getStoredAuthUser = async (): Promise<StoredAuthUser | null> => {
  const raw = await SecureStore.getItemAsync(AUTH_USER_STORE_KEYS.AUTH_USER_JSON);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    const pointsRaw = await SecureStore.getItemAsync(
      AUTH_USER_STORE_KEYS.AUTH_POINTS,
    );
    const points = toNumberOrNull(pointsRaw);

    if (typeof parsed.points === "number") return parsed;
    if (typeof points === "number") return { ...parsed, points };
    return parsed;
  } catch {
    return null;
  }
};

export const updateStoredAuthUserPoints = async (points: number) => {
  const current = await getStoredAuthUser();
  if (!current) return;

  const nextPoints = Math.max(0, Math.floor(points));
  const nextUser: StoredAuthUser = {
    ...current,
    points: nextPoints,
    updated_at: new Date().toISOString(),
  };

  await Promise.all([
    SecureStore.setItemAsync(
      AUTH_USER_STORE_KEYS.AUTH_USER_JSON,
      JSON.stringify(nextUser),
    ),
    SecureStore.setItemAsync(
      AUTH_USER_STORE_KEYS.AUTH_POINTS,
      String(nextPoints),
    ),
  ]);
};
