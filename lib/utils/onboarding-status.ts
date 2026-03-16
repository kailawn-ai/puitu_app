import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "onboarding_profile_completed";

const buildKey = (identity: string) => `${KEY_PREFIX}:${identity}`;

export const resolveOnboardingIdentity = (params: {
  uid?: string | null;
  email?: string | null;
  phone?: string | null;
}) => {
  const uid = params.uid?.trim();
  if (uid) return uid;

  const email = params.email?.trim().toLowerCase();
  if (email) return email;

  const phone = params.phone?.trim();
  if (phone) return phone;

  return null;
};

export const hasCompletedProfileOnboarding = async (
  identity: string | null,
) => {
  if (!identity) return false;
  const value = await AsyncStorage.getItem(buildKey(identity));
  return value === "true";
};

export const markProfileOnboardingCompleted = async (
  identity: string | null,
) => {
  if (!identity) return;
  await AsyncStorage.setItem(buildKey(identity), "true");
};
