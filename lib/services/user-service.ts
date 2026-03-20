import { apiClient } from "@/lib/api/api-client";

export interface UserProfile {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  dob?: string | null;
  email?: string | null;
  country_code?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  town?: string | null;
  profile_image?: string | null;
  qualifications?:
    | number[]
    | Array<{
        id?: number | null;
        name?: string | null;
      }>;
  is_active?: boolean;
}

export interface UserPayload {
  name?: string;
  phone?: string;
  dob?: string;
  email?: string;
  country_code?: string;
  country?: string;
  state?: string;
  district?: string;
  town?: string;
  profile_image?: string;
  qualifications?: number[];
}

export interface PaginationParams {
  search?: string;
  role?: "user";
  country?: string;
  is_active?: boolean;
  per_page?: number;
  sort?: string;
}

export const UserService = {
  /**
   * ---------------------------------------
   * 👤 SELF USER (Authenticated user only)
   * ---------------------------------------
   */

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<UserProfile>("/create-user/me");
    return res.data;
  },

  async updateMe(payload: UserPayload): Promise<UserProfile> {
    const res = await apiClient.put<UserProfile>("/create-user/me", payload);

    return res.data;
  },

  async deleteMe() {
    const res = await apiClient.delete("/create-user/me");
    return res.data;
  },

  async deleteMyCreatorProfile() {
    const res = await apiClient.delete("/create-user/me/creator");
    return res.data;
  },

  async detachMyQualifications() {
    const res = await apiClient.delete("/create-user/me/qualifications");
    return res.data;
  },
};
