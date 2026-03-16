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

export interface CourseLite {
  id: number;
  title?: string;
  name?: string;
  slug?: string | null;
  thumbnail_url?: string | null;
}

export interface UserLite {
  id: string;
  name?: string | null;
  profile_image?: string | null;
}

export type QuizHardness = "easy" | "medium" | "hard";
export type QuizStatus = "draft" | "scheduled" | "published" | "archived";
export type QuizQuestionType = "multiple_choice" | "true_false";

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean;
  order?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  explanation?: string | null;
  order?: number | null;
  points: number;
  type: QuizQuestionType;
  is_active?: boolean;
  options?: QuizOption[];
  created_at?: string;
  updated_at?: string;
}

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  hardness: QuizHardness;
  status: QuizStatus;
  is_active: boolean;
  scheduled_at?: string | null;
  duration?: number | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  attempts_count?: number;
  questions_count?: number;
  qualifications?: QualificationLite[];
  course?: CourseLite;
  questions?: QuizQuestion[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizAnswer {
  id: number;
  quiz_attempt_id: number;
  question_id: number;
  option_id: number;
  is_correct: boolean;
  points_earned: number;
  time_taken?: number | null;
  question?: QuizQuestion;
  option?: QuizOption;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: string;
  total_questions: number;
  score?: number | null;
  percentage?: number | null;
  points_earned?: number | null;
  time_taken?: number | null;
  started_at?: string;
  completed_at?: string | null;
  quiz?: Quiz;
  user?: UserLite;
  answers?: QuizAnswer[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizListParams {
  per_page?: number;
  page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  status?: QuizStatus;
  hardness?: QuizHardness;
  course_id?: number;
  qualification_id?: number;
}

export interface UserQuizListParams {
  per_page?: number;
  page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  hardness?: QuizHardness;
  qualification_id?: number;
}

export interface UserAttemptsParams {
  per_page?: number;
  page?: number;
  quiz_id?: number;
  status?: "completed" | "active";
}

export interface CreateQuizPayload {
  course_id: number;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  hardness: QuizHardness;
  status: QuizStatus;
  is_active?: boolean;
  scheduled_at?: string | null;
  duration?: number | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  qualification_ids?: number[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  hardness?: QuizHardness;
  status?: QuizStatus;
  is_active?: boolean;
  scheduled_at?: string | null;
  duration?: number | null;
  max_attempts?: number | null;
  passing_score?: number | null;
  qualification_ids?: number[];
}

export interface AddQuestionPayload {
  question_text: string;
  explanation?: string | null;
  order?: number | null;
  points: number;
  type: QuizQuestionType;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    order?: number | null;
  }>;
}

export interface UpdateQuestionPayload {
  question_text: string;
  explanation?: string | null;
  order?: number | null;
  points: number;
  type: QuizQuestionType;
  is_active?: boolean;
}

export interface StartQuizResponse {
  attempt_id: number;
  resume: boolean;
  started_at: string;
  total_questions?: number;
  duration?: number | null;
}

export interface SubmitAnswerInput {
  option_id: number;
  time_taken?: number;
}

export interface SubmitQuizPayload {
  // Controller expects keys as question IDs.
  answers: Record<string, SubmitAnswerInput>;
  total_time_taken?: number;
}

export interface SubmitQuizResponse {
  score: number;
  total_questions: number;
  percentage: number;
  points_earned: number;
  total_points: number;
  performance_rating: string;
  passed: boolean;
  attempt_id: number;
}

export interface ToggleQuizStatusResponse {
  is_active: boolean;
}

export interface QuizStats {
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  average_percentage: number;
  average_time_taken: number;
  total_participants: number;
  questions_count: number;
  hardness: QuizHardness | string;
  completion_rate: number;
  pass_rate: number;
}

export interface UserQuizStats {
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  total_points_earned: number;
  quizzes_attempted: number;
  perfect_scores: number;
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

export const QuizService = {
  // User/public quiz endpoints
  async getPublishedQuizzes(
    params?: UserQuizListParams,
  ): Promise<PaginatedResponse<Quiz>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Quiz>>(
      `/quizzes/published/list${query}`,
    );
    return res.data;
  },

  async getById(quizId: number | string): Promise<Quiz> {
    const res = await apiClient.get<Quiz>(`/quizzes/${quizId}`);
    return res.data;
  },

  async startQuiz(quizId: number | string): Promise<StartQuizResponse> {
    const res = await apiClient.post<StartQuizResponse>(`/quizzes/${quizId}/start`);
    return res.data;
  },

  async submitQuiz(
    quizId: number | string,
    attemptId: number | string,
    payload: SubmitQuizPayload,
  ): Promise<SubmitQuizResponse> {
    const res = await apiClient.post<SubmitQuizResponse>(
      `/quizzes/${quizId}/attempts/${attemptId}/submit`,
      payload,
    );
    return res.data;
  },

  async getUserAttempts(
    params?: UserAttemptsParams,
  ): Promise<PaginatedResponse<QuizAttempt>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<QuizAttempt>>(
      `/quizzes/user/attempts${query}`,
    );
    return res.data;
  },

  async getAttemptDetails(attemptId: number | string): Promise<QuizAttempt> {
    const res = await apiClient.get<QuizAttempt>(`/quizzes/user/attempts/${attemptId}`);
    return res.data;
  },

  async getUserStats(): Promise<UserQuizStats> {
    const res = await apiClient.get<UserQuizStats>("/quizzes/user/stats");
    return res.data;
  },

  async getLeaderboard(
    quizId: number | string,
    params?: { per_page?: number; page?: number },
  ): Promise<PaginatedResponse<QuizAttempt>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<QuizAttempt>>(
      `/quizzes/${quizId}/leaderboard${query}`,
    );
    return res.data;
  },

  // Admin quiz endpoints
  async getQuizzes(params?: QuizListParams): Promise<PaginatedResponse<Quiz>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Quiz>>(`/quizzes${query}`);
    return res.data;
  },

  async create(payload: CreateQuizPayload): Promise<Quiz> {
    const res = await apiClient.post<Quiz>("/quizzes", payload);
    return res.data;
  },

  async update(
    quizId: number | string,
    payload: UpdateQuizPayload,
  ): Promise<Quiz> {
    const res = await apiClient.put<Quiz>(`/quizzes/${quizId}`, payload);
    return res.data;
  },

  async delete(
    quizId: number | string,
  ): Promise<{ status?: string; message?: string }> {
    const res = await apiClient.delete<{ status?: string; message?: string }>(
      `/quizzes/${quizId}`,
    );
    return res.data;
  },

  async toggleStatus(
    quizId: number | string,
  ): Promise<ToggleQuizStatusResponse> {
    const res = await apiClient.patch<ToggleQuizStatusResponse>(
      `/quizzes/${quizId}/toggle-status`,
    );
    return res.data;
  },

  async getQuizStats(quizId: number | string): Promise<QuizStats> {
    const res = await apiClient.get<QuizStats>(`/quizzes/${quizId}/stats`);
    return res.data;
  },

  // Admin question endpoints
  async addQuestion(
    quizId: number | string,
    payload: AddQuestionPayload,
  ): Promise<QuizQuestion> {
    const res = await apiClient.post<QuizQuestion>(
      `/quizzes/${quizId}/questions`,
      payload,
    );
    return res.data;
  },

  async updateQuestion(
    questionId: number | string,
    payload: UpdateQuestionPayload,
  ): Promise<QuizQuestion> {
    const res = await apiClient.put<QuizQuestion>(
      `/quizzes/questions/${questionId}`,
      payload,
    );
    return res.data;
  },

  async deleteQuestion(
    questionId: number | string,
  ): Promise<{ status?: string; message?: string }> {
    const res = await apiClient.delete<{ status?: string; message?: string }>(
      `/quizzes/questions/${questionId}`,
    );
    return res.data;
  },
};

export default QuizService;
