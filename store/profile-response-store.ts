import { create } from "zustand";

import type { ProfileResponseData } from "@/lib/services/profile-response-service";

interface ProfileResponseStore {
  profileResponse: ProfileResponseData | null;
  setProfileResponse: (profileResponse: ProfileResponseData | null) => void;
  clearProfileResponse: () => void;
}

export const useProfileResponseStore = create<ProfileResponseStore>((set) => ({
  profileResponse: null,
  setProfileResponse: (profileResponse) => set({ profileResponse }),
  clearProfileResponse: () => set({ profileResponse: null }),
}));
