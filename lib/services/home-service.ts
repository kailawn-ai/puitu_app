import { apiClient } from "@/lib/api/api-client";

/**
 * ---------------------------------------
 * 🏠 HOME DATA TYPES
 * ---------------------------------------
 */

export interface HomeParams {
  uid?: string;
  limit?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string | null;
}

export interface CurrentUserQualification {
  id: number;
  name: string;
  slug?: string | null;
}

export interface CurrentUserCreatorProfile {
  id?: number;
  user_id?: string;
  marital_status?: string | null;
  occupation?: string | null;
  religion?: string | null;
  bio?: string | null;
  total_years_experience?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  town?: string | null;
  profile_image?: string | null;
  is_active: boolean;
  creator_profile?: CurrentUserCreatorProfile | null;
  qualifications?: CurrentUserQualification[];
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
  is_free_preview: number;
  level: string;
  language: string;
  sections_count: number;
  documents_count: number;
  subcategory?: {
    id: number;
    name: string;
  };
}

export interface Quiz {
  id: number;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  description?: string | null;
  hardness?: "easy" | "medium" | "hard" | string;
  status?: "draft" | "scheduled" | "published" | "archived" | string;
  is_active?: boolean;
  matches_user_qualifications?: boolean;
  questions_count: number;
  attempts_count: number;
  course?: {
    id: number;
    title?: string;
    slug?: string | null;
    thumbnail_url?: string | null;
  };
  qualifications?: {
    id: number;
    name: string;
    slug?: string | null;
  }[];
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  explanation?: string | null;
  order?: number | null;
  points: number;
  type?: "multiple_choice" | "true_false" | string;
  options?: QuizOption[];
}

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  order?: number | null;
  is_correct?: boolean;
}

export interface QuizRecommendationMeta {
  recommendation_type: "personalized" | "general";
  matched_qualification_ids: number[];
}

export interface Job {
  id: number;
  title: string;
  image: string;
  job_type: string;
  tag: string;
  slug: string;
  qualifications: {
    id: number;
    name: string;
  };
  detail: {
    description: string;
    email: string;
  };
}

export interface OldQuestion {
  id: number;
  title: string;
  thumbnail_url: string;
  slug: string;
  detail?: {
    image: string;
    is_free: boolean;
    price: number;
  };
  year?: {
    id: number;
    name: string;
    year: number;
  };
  semester?: {
    id: number;
    name: string;
  };
}

export interface TrendingItem {
  type: "course" | "quiz";
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
  created_at: string;
}

export interface HomeResponse {
  current_user?: CurrentUser | null;
  categories: Category[];
  courses: Course[];
  quizzes: Quiz[];
  quiz_recommendation?: QuizRecommendationMeta;
  old_questions: OldQuestion[];
  jobs: Job[];
  trending_content: TrendingItem[];
  recommendation_type: "personalized" | "general";
  user_has_qualifications: boolean;
  user_qualifications: string[];
  stats: {
    total_courses: number;
    total_quizzes: number;
    total_questions: number;
    total_jobs: number;
  };
}

/**
 * ---------------------------------------
 * 🏠 HOME SERVICE
 * ---------------------------------------
 */

export const HomeService = {
  /**
   * Get Home Data (Personalized / General)
   */
  async getHome(params?: HomeParams): Promise<HomeResponse> {
    const res = await apiClient.get("/home", {
      params: {
        limit: params?.limit ?? 8,
      },
    });

    return res.data;
  },

  /**
   * Only categories (optional helper)
   */
  async getCategories(): Promise<Category[]> {
    const data = await this.getHome();
    return data.categories;
  },

  /**
   * Only courses (optional helper)
   */
  async getCourses(uid?: string): Promise<Course[]> {
    const data = await this.getHome({ uid });
    return data.courses;
  },

  /**
   * Trending content helper
   */
  async getTrending(uid?: string): Promise<TrendingItem[]> {
    const data = await this.getHome({ uid });
    return data.trending_content;
  },
};
