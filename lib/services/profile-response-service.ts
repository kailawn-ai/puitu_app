import { apiClient } from "@/lib/api/api-client";

export interface ProfileResponseUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  country_code?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  town?: string | null;
  profile_image?: string | null;
  is_active?: boolean;
}

export interface ProfileResponseQualification {
  id: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}

export interface ProfileResponseDetail {
  creator_profile?: Record<string, unknown> | null;
  qualifications: ProfileResponseQualification[];
  qualification_count: number;
  join_date?: string | null;
  joined_at?: string | null;
  joined_label?: string | null;
}

export interface ProfileResponsePoints {
  available_points: number;
  total_earned_points: number;
  total_spent_points: number;
  lifetime_points: number;
}

export interface ProfileResponseStats {
  purchase_count: number;
  active_purchase_count: number;
  completed_quiz_count: number;
  online_time_spent_seconds: number;
  online_time_spent_minutes: number;
  online_time_spent_hours: number;
}

export interface ProfileResponseData {
  user: ProfileResponseUser;
  detail: ProfileResponseDetail;
  points: ProfileResponsePoints;
  stats: ProfileResponseStats;
  generated_at?: string;
}

export const ProfileResponseService = {
  async getProfileResponse(): Promise<ProfileResponseData> {
    const res = await apiClient.get<ProfileResponseData>("/profile/response");
    return res.data;
  },
};

export default ProfileResponseService;
