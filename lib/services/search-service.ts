import { apiClient } from "@/lib/api/api-client";

export type SearchEntityType =
  | "course"
  | "quiz"
  | "job"
  | "old_question"
  | "community_group";

export interface SearchDocumentMetadata {
  thumbnail_url?: string | null;
  image?: string | null;
  avatar_url?: string | null;
  category?: string | null;
  subcategory?: string | null;
  creator_name?: string | null;
  course_title?: string | null;
  section_title?: string | null;
  owner_name?: string | null;
  members_count?: number | null;
  hardness?: string | null;
  job_type?: string | null;
  tag?: string | null;
}

export interface SearchDocument {
  id: number;
  entity_type: SearchEntityType;
  entity_id: number;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  keywords?: string | null;
  search_text?: string | null;
  language: string;
  status: string;
  visibility: string;
  metadata?: SearchDocumentMetadata | null;
  popularity_score?: number;
  freshness_score?: number;
  quality_score?: number;
  relevance_score?: number;
  published_at?: string | null;
  last_indexed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SearchSuggestion {
  entity_type: SearchEntityType;
  entity_id: number;
  title: string;
  subtitle?: string | null;
  metadata?: SearchDocumentMetadata | null;
}

export interface SearchPaginatedResponse<T> {
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

export interface SearchAllParams {
  q?: string;
  types?: SearchEntityType[];
  per_page?: number;
}

export interface SearchListItem {
  id: string;
  entityType: SearchEntityType;
  entityId: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  route: string;
  relevanceScore?: number;
  badge?: string | null;
}

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return "";

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        query.append(key, value.join(","));
      }
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const buildSearchRoute = (doc: SearchDocument | SearchSuggestion): string => {
  switch (doc.entity_type) {
    case "course":
      return `/course/${doc.entity_id}`;
    case "quiz":
      return `/quiz/${doc.entity_id}`;
    case "job":
      return `/job/${doc.entity_id}`;
    case "old_question":
      return `/old-question/${doc.entity_id}`;
    case "community_group":
      return `/community`;
    default:
      return "/";
  }
};

const buildBadge = (
  doc: SearchDocument | SearchSuggestion,
): string | null => {
  switch (doc.entity_type) {
    case "course":
      return doc.metadata?.subcategory ?? "Course";
    case "quiz":
      return doc.metadata?.hardness ?? "Quiz";
    case "job":
      return doc.metadata?.job_type ?? "Job";
    case "old_question":
      return doc.metadata?.course_title ?? "Old Question";
    case "community_group":
      return "Community";
    default:
      return null;
  }
};

const buildImage = (
  metadata?: SearchDocumentMetadata | null,
): string | null => {
  return (
    metadata?.thumbnail_url ??
    metadata?.image ??
    metadata?.avatar_url ??
    null
  );
};

const mapSearchDocument = (doc: SearchDocument): SearchListItem => ({
  id: `${doc.entity_type}-${doc.entity_id}`,
  entityType: doc.entity_type,
  entityId: doc.entity_id,
  title: doc.title,
  subtitle: doc.subtitle ?? null,
  description: doc.body ?? null,
  image: buildImage(doc.metadata),
  route: buildSearchRoute(doc),
  relevanceScore: doc.relevance_score,
  badge: buildBadge(doc),
});

const mapSearchSuggestion = (doc: SearchSuggestion): SearchListItem => ({
  id: `${doc.entity_type}-${doc.entity_id}`,
  entityType: doc.entity_type,
  entityId: doc.entity_id,
  title: doc.title,
  subtitle: doc.subtitle ?? null,
  description: null,
  image: buildImage(doc.metadata),
  route: buildSearchRoute(doc),
  badge: buildBadge(doc),
});

export const SearchService = {
  async searchAll(
    params?: SearchAllParams,
  ): Promise<SearchPaginatedResponse<SearchDocument>> {
    const query = buildQueryString({
      q: params?.q,
      types: params?.types,
      per_page: params?.per_page,
    });
    const res = await apiClient.get<SearchPaginatedResponse<SearchDocument>>(
      `/search/all${query}`,
    );
    return res.data;
  },

  async searchAllItems(params?: SearchAllParams): Promise<SearchListItem[]> {
    const response = await this.searchAll(params);
    return response.data.map(mapSearchDocument);
  },

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const queryString = buildQueryString({ q: query });
    const res = await apiClient.get<SearchSuggestion[]>(
      `/search/suggestions${queryString}`,
    );
    return res.data;
  },

  async getSuggestionItems(query: string): Promise<SearchListItem[]> {
    const items = await this.getSuggestions(query);
    return items.map(mapSearchSuggestion);
  },
};

export default SearchService;
