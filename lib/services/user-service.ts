import { apiClient } from "@/lib/api/api-client";

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

  async getMe() {
    const res = await apiClient.get("/create-user/me");
    return res.data;
  },

  async updateMe(payload: UserPayload) {
    const res = await apiClient.put("/create-user/me", payload);
    console.log("updateMe response:", res);

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
