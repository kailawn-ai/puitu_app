import { apiClient } from "@/lib/api/api-client";

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page: number;
  last_page_url?: string;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

export type PointsTransactionType = "earned" | "spent" | "expired" | "adjustment";
export type PointsReasonType =
  | "bonus"
  | "correction"
  | "refund"
  | "other"
  | "penalty";
export type RewardType = "discount" | "voucher" | "gift" | "other";
export type UserRewardStatus = "pending" | "redeemed" | "expired" | "cancelled";
export type LeaderboardTimeframe = "today" | "week" | "month" | "all_time";

export interface UserLite {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image?: string | null;
}

export interface UserPoints {
  id?: number;
  user_id: string;
  available_points?: number;
  total_earned_points?: number;
  total_spent_points?: number;
  lifetime_points?: number;
  created_at?: string;
  updated_at?: string;
  user?: UserLite;
}

export interface PointsTransaction {
  id: number;
  user_id: string;
  points: number;
  type: PointsTransactionType | string;
  source_type?: string | null;
  source_id?: string | number | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: UserLite;
}

export interface PointsSummary {
  available_points?: number;
  total_earned_points?: number;
  total_spent_points?: number;
  lifetime_points?: number;
}

export interface PointsSummaryResponse {
  summary: PointsSummary;
  recent_transactions: PointsTransaction[];
}

export interface LeaderboardItem extends UserPoints {
  rank?: number;
}

export interface Reward {
  id: number;
  title?: string;
  name?: string;
  description?: string | null;
  type?: RewardType | string;
  points_required: number;
  is_active?: boolean;
  stock?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserReward {
  id: number;
  user_id: string;
  reward_id: number;
  status?: UserRewardStatus | string;
  redeemed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  reward?: Reward;
  user?: UserLite;
}

export interface PointsStatsResponse {
  stats: Record<string, number | string | null>;
  recent_activity: PointsTransaction[];
}

export interface UserPointsDetailsResponse {
  user_points: UserPoints | null;
  recent_transactions: PointsTransaction[];
  recent_rewards: UserReward[];
}

export interface PointsHistoryParams {
  type?: PointsTransactionType | string;
  source_type?: string;
  per_page?: number;
  page?: number;
}

export interface LeaderboardParams {
  timeframe?: LeaderboardTimeframe;
  per_page?: number;
  page?: number;
}

export interface RewardsParams {
  type?: RewardType | string;
  min_points?: number;
  max_points?: number;
  per_page?: number;
  page?: number;
}

export interface UserRewardsParams {
  status?: UserRewardStatus | string;
  per_page?: number;
  page?: number;
}

export interface AdminUsersParams {
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  min_points?: number;
  max_points?: number;
  per_page?: number;
  page?: number;
}

export interface AdminTransactionsParams {
  search?: string;
  type?: PointsTransactionType | string;
  source_type?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

export interface PointsAdjustPayload {
  points: number;
  description?: string;
  reason?: PointsReasonType | string;
}

export interface ResetPointsPayload {
  description?: string;
  reason?: PointsReasonType | string;
}

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

export const PointService = {
  // User endpoints
  async getSummary(): Promise<PointsSummaryResponse> {
    const res = await apiClient.get<PointsSummaryResponse>("/points/summary");
    return res.data;
  },

  async getHistory(
    params?: PointsHistoryParams,
  ): Promise<PaginatedResponse<PointsTransaction>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<PointsTransaction>>(
      `/points/history${query}`,
    );
    return res.data;
  },

  async getLeaderboard(
    params?: LeaderboardParams,
  ): Promise<PaginatedResponse<LeaderboardItem>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<LeaderboardItem>>(
      `/points/leaderboard${query}`,
    );
    return res.data;
  },

  async getRewards(params?: RewardsParams): Promise<PaginatedResponse<Reward>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Reward>>(
      `/points/rewards${query}`,
    );
    return res.data;
  },

  async redeemReward(
    rewardId: number | string,
  ): Promise<{
    status?: string;
    message?: string;
    [key: string]: unknown;
  }> {
    const res = await apiClient.post<{
      status?: string;
      message?: string;
      [key: string]: unknown;
    }>(`/points/rewards/${rewardId}/redeem`);
    return res.data;
  },

  async getUserRewards(
    params?: UserRewardsParams,
  ): Promise<PaginatedResponse<UserReward>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<UserReward>>(
      `/points/user/rewards${query}`,
    );
    return res.data;
  },

  // Admin endpoints
  async getUsers(params?: AdminUsersParams): Promise<PaginatedResponse<UserPoints>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<UserPoints>>(
      `/points/users${query}`,
    );
    return res.data;
  },

  async getStats(): Promise<PointsStatsResponse> {
    const res = await apiClient.get<PointsStatsResponse>("/points/stats");
    return res.data;
  },

  async getTransactions(
    params?: AdminTransactionsParams,
  ): Promise<PaginatedResponse<PointsTransaction>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<PointsTransaction>>(
      `/points/transactions${query}`,
    );
    return res.data;
  },

  async addPointsToUser(
    userId: string,
    payload: PointsAdjustPayload,
  ): Promise<{
    status?: string;
    message?: string;
    [key: string]: unknown;
  }> {
    const res = await apiClient.post<{
      status?: string;
      message?: string;
      [key: string]: unknown;
    }>(`/points/users/${userId}/add-points`, payload);
    return res.data;
  },

  async deductPointsFromUser(
    userId: string,
    payload: PointsAdjustPayload,
  ): Promise<{
    status?: string;
    message?: string;
    [key: string]: unknown;
  }> {
    const res = await apiClient.post<{
      status?: string;
      message?: string;
      [key: string]: unknown;
    }>(`/points/users/${userId}/deduct-points`, payload);
    return res.data;
  },

  async resetUserPoints(
    userId: string,
    payload?: ResetPointsPayload,
  ): Promise<{
    status?: string;
    message?: string;
    [key: string]: unknown;
  }> {
    const res = await apiClient.post<{
      status?: string;
      message?: string;
      [key: string]: unknown;
    }>(`/points/users/${userId}/reset-points`, payload ?? {});
    return res.data;
  },

  async getUserPointsDetails(
    userId: string,
  ): Promise<UserPointsDetailsResponse> {
    const res = await apiClient.get<UserPointsDetailsResponse>(
      `/points/users/${userId}/details`,
    );
    return res.data;
  },
};

export default PointService;
