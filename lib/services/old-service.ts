import { apiClient } from "@/lib/api/api-client";

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page: number;
  last_page_url?: string;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  path?: string;
  per_page: number;
  to?: number | null;
  total: number;
}

export interface QualificationLite {
  id: number;
  name: string;
  slug?: string | null;
  is_custom?: boolean;
}

export interface CourseLite {
  id: number;
  name?: string;
  title?: string;
  slug?: string | null;
  description?: string | null;
}

export interface YearLite {
  id: number;
  year?: number;
  name?: string;
  slug?: string | null;
}

export interface SemesterLite {
  id: number;
  name?: string;
  slug?: string | null;
}

export interface SectionLite {
  id: number;
  name?: string;
  title?: string;
  slug?: string | null;
  code?: string | null;
}

export interface OldQuestionDetail {
  old_question_id: number;
  description?: string | null;
  image?: string | null;
  file: string;
  is_premium: boolean;
  is_active: boolean;
}

export interface OldQuestion {
  id: number;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  qualification_id: number;
  course_id?: number | null;
  section_id?: number | null;
  year_id: number;
  semester_id?: number | null;
  created_at?: string;
  updated_at?: string;
  detail?: OldQuestionDetail;
  qualification?: QualificationLite;
  course?: CourseLite;
  section?: SectionLite;
  year?: YearLite;
  semester?: SemesterLite;
}

export interface ProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  allow_points?: boolean;
  points_price?: number | null;
  discount_price?: number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number;
  access_duration_days?: number | null;
  category?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface OldQuestionPayload {
  title: string;
  thumbnail_url?: string | null;
  qualification_id: number;
  course_id?: number | null;
  section_id?: number | null;
  year_id: number;
  semester_id?: number | null;
  description?: string | null;
  image?: string | null;
  file: string;
  is_premium?: boolean;
  is_active?: boolean;
  product?: ProductInput;
}

export interface OldQuestionListParams {
  qualification_id?: number;
  course_id?: number;
  year_id?: number;
  semester_id?: number;
  section_id?: number;
  is_premium?: boolean;
  is_active?: boolean;
  search?: string;
  slug?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  sort_multiple?: string;
  per_page?: number;
  page?: number;
}

export interface DownloadInfo {
  success: boolean;
  download_url: string;
  filename: string;
  message?: string;
}

export interface PremiumAccessInfo {
  success: boolean;
  has_access: boolean;
  is_premium: boolean;
  message?: string;
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

export const OldService = {
  async getOldQuestions(
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions${query}`,
    );
    return res.data;
  },

  async filterOldQuestions(
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/filter${query}`,
    );
    return res.data;
  },

  async getOldQuestionById(
    id: number | string,
    modelType: string,
    modelId: number | string,
  ): Promise<OldQuestion> {
    const res = await apiClient.get<OldQuestion>(
      `/old-questions/${id}/${encodeURIComponent(modelType)}/${modelId}`,
    );
    return res.data;
  },

  async createOldQuestion(payload: OldQuestionPayload): Promise<OldQuestion> {
    const res = await apiClient.post<OldQuestion>("/old-questions", payload);
    return res.data;
  },

  async updateOldQuestion(
    id: number | string,
    payload: OldQuestionPayload,
  ): Promise<OldQuestion> {
    const res = await apiClient.put<OldQuestion>(
      `/old-questions/${id}`,
      payload,
    );
    return res.data;
  },

  async patchOldQuestion(
    id: number | string,
    payload: Partial<OldQuestionPayload>,
  ): Promise<OldQuestion> {
    const res = await apiClient.patch<OldQuestion>(
      `/old-questions/${id}`,
      payload,
    );
    return res.data;
  },

  async deleteOldQuestion(id: number | string): Promise<unknown> {
    const res = await apiClient.delete<unknown>(`/old-questions/${id}`);
    return res.data;
  },

  async toggleOldQuestionStatus(id: number | string): Promise<unknown> {
    const res = await apiClient.patch<unknown>(
      `/old-questions/${id}/toggle-status`,
    );
    return res.data;
  },

  async getDownloadInfo(id: number | string): Promise<DownloadInfo> {
    const res = await apiClient.get<DownloadInfo>(
      `/old-questions/${id}/download`,
    );
    return res.data;
  },

  async checkPremiumAccess(id: number | string): Promise<PremiumAccessInfo> {
    const res = await apiClient.get<PremiumAccessInfo>(
      `/old-questions/${id}/check-premium-access`,
    );
    return res.data;
  },

  async browseQualifications(): Promise<QualificationLite[]> {
    const res = await apiClient.get<QualificationLite[]>(
      "/old-questions/browse/qualifications",
    );
    return res.data;
  },

  async browseCourses(): Promise<CourseLite[]> {
    const res = await apiClient.get<CourseLite[]>(
      "/old-questions/browse/courses",
    );
    return res.data;
  },

  async browseYears(courseId: number | string): Promise<YearLite[]> {
    const res = await apiClient.get<YearLite[]>(
      `/old-questions/browse/courses/${courseId}/years`,
    );
    return res.data;
  },

  async browseSemesters(
    courseId: number | string,
    yearId: number | string,
  ): Promise<SemesterLite[]> {
    const res = await apiClient.get<SemesterLite[]>(
      `/old-questions/browse/courses/${courseId}/years/${yearId}/semesters`,
    );
    return res.data;
  },

  async browseSubjects(
    courseId: number | string,
    yearId: number | string,
    semesterId: number | string,
  ): Promise<SectionLite[]> {
    const res = await apiClient.get<SectionLite[]>(
      `/old-questions/browse/courses/${courseId}/years/${yearId}/semesters/${semesterId}/subjects`,
    );
    return res.data;
  },

  async browseQuestions(
    courseId: number | string,
    yearId: number | string,
    semesterId: number | string,
    subjectId: number | string,
    params?: { per_page?: number; page?: number },
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/browse/courses/${courseId}/years/${yearId}/semesters/${semesterId}/subjects/${subjectId}/questions${query}`,
    );
    return res.data;
  },

  async getQuestionsByCourse(
    courseId: number | string,
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/courses/${courseId}${query}`,
    );
    return res.data;
  },

  async getQuestionsByYear(
    yearId: number | string,
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/years/${yearId}${query}`,
    );
    return res.data;
  },

  async getQuestionsBySemester(
    semesterId: number | string,
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/semesters/${semesterId}${query}`,
    );
    return res.data;
  },

  async getQuestionsBySection(
    sectionId: number | string,
    params?: OldQuestionListParams,
  ): Promise<PaginatedResponse<OldQuestion>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<OldQuestion>>(
      `/old-questions/sections/${sectionId}${query}`,
    );
    return res.data;
  },
};

export default OldService;
