import { apiClient } from "@/lib/api/api-client";

export interface CreatorProfile {
  id?: number;
  user_id?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed" | null;
  occupation?: string | null;
  religion?: string | null;
  bio?: string | null;
  resume_url?: string | null;
  document_url?: string[] | null;
  expert_at?: string | null;
  total_years_experience?: number | string | null;
  verification_status?: "draft" | "pending" | "approved" | "rejected" | null;
  verification_submitted_at?: string | null;
  verified_at?: string | null;
  verified_by_user_id?: string | null;
  admin_review_notes?: string | null;
  is_verified?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreatorUserSummary {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  town?: string | null;
  profile_image?: string | null;
  is_active?: boolean;
}

export interface CreatorQualificationSummary {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}

export interface CreatorProfileResponse {
  user?: CreatorUserSummary | null;
  creator_profile?: CreatorProfile | null;
  qualifications?: CreatorQualificationSummary[];
}

export interface CreatorProfilePayload {
  marital_status?: "single" | "married" | "divorced" | "widowed" | null;
  occupation?: string;
  religion?: string;
  bio?: string;
  resume_url?: string;
  document_url?: string[];
  expert_at?: string;
  total_years_experience?: number;
  verification_status?: "draft" | "pending" | "approved" | "rejected";
  verification_submitted_at?: string;
  verified_at?: string;
  verified_by_user_id?: string;
  admin_review_notes?: string;
  is_verified?: boolean;
}

const wrapCreatorPayload = (payload: CreatorProfilePayload) => ({
  creator: payload,
});

export const CreatorService = {
  async getMe(): Promise<CreatorProfileResponse> {
    const res = await apiClient.get<CreatorProfileResponse>("/creators/me");
    return res.data;
  },

  async updateMe(payload: CreatorProfilePayload): Promise<CreatorProfileResponse> {
    const res = await apiClient.put<CreatorProfileResponse>(
      "/creators/me",
      wrapCreatorPayload(payload),
    );

    return res.data;
  },

  async deleteMe() {
    const res = await apiClient.delete("/creators/me");
    return res.data;
  },
};

export default CreatorService;
