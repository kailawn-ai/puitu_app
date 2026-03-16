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

export interface QualificationLite {
  id: number;
  name?: string;
  slug?: string | null;
}

export interface JobDetail {
  id: number;
  job_id: number;
  description: string;
  phone_1?: string | null;
  phone_2?: string | null;
  email?: string | null;
  link?: string | null;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: number;
  title: string;
  slug?: string | null;
  image?: string | null;
  tag?: string | null;
  job_type: "government" | "public" | "private";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  detail?: JobDetail | null;
  qualifications?: QualificationLite[];
}

export interface JobListParams {
  per_page?: number;
  page?: number;
  search?: string;
  job_type?: "government" | "public" | "private";
  qualification_id?: number;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface CreateJobPayload {
  title: string;
  image?: string | null;
  tag?: string | null;
  job_type: "government" | "public" | "private";
  is_active?: boolean;
  description: string;
  phone_1?: string | null;
  phone_2?: string | null;
  email?: string | null;
  link?: string | null;
  qualifications?: number[];
}

export interface UpdateJobPayload {
  title?: string;
  image?: string | null;
  tag?: string | null;
  job_type?: "government" | "public" | "private";
  is_active?: boolean;
  description?: string;
  phone_1?: string | null;
  phone_2?: string | null;
  email?: string | null;
  link?: string | null;
  qualifications?: number[];
}

export interface ToggleJobStatusResponse {
  is_active: boolean;
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

export const JobService = {
  async getJobs(params?: JobListParams): Promise<PaginatedResponse<Job>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Job>>(`/jobs${query}`);
    return res.data;
  },

  async getPublicJobs(params?: JobListParams): Promise<PaginatedResponse<Job>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Job>>(
      `/jobs/public${query}`,
    );
    return res.data;
  },

  async getById(jobId: number | string): Promise<Job> {
    const res = await apiClient.get<Job>(`/jobs/${jobId}`);
    return res.data;
  },

  async create(payload: CreateJobPayload): Promise<Job> {
    const res = await apiClient.post<Job>("/jobs", payload);
    return res.data;
  },

  async update(jobId: number | string, payload: UpdateJobPayload): Promise<Job> {
    const res = await apiClient.put<Job>(`/jobs/${jobId}`, payload);
    return res.data;
  },

  async delete(jobId: number | string): Promise<{
    status?: string;
    message?: string;
  }> {
    const res = await apiClient.delete<{ status?: string; message?: string }>(
      `/jobs/${jobId}`,
    );
    return res.data;
  },

  async toggleStatus(jobId: number | string): Promise<ToggleJobStatusResponse> {
    const res = await apiClient.patch<ToggleJobStatusResponse>(
      `/jobs/${jobId}/toggle-status`,
    );
    return res.data;
  },
};

export default JobService;
