import { apiClient } from "@/lib/api/api-client";

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from?: number | null;
  last_page: number;
  last_page_url?: string;
  links?: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

export interface ProductableLite {
  id?: number | string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
  thumbnail_url?: string | null;
}

export interface Product {
  id: number;
  productable_id: number;
  productable_type: string;
  name: string;
  description?: string | null;
  price?: string | number | null;
  allow_points: boolean;
  points_price?: number | null;
  discount_price?: string | number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number | null;
  access_duration_days?: number | null;
  category?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_free_preview?: boolean;
  created_at?: string;
  updated_at?: string;
  productable?: ProductableLite | null;
}

export interface ProductListParams {
  category?: string;
  featured?: boolean;
}

export interface ResolveProductParams {
  model_type:
    | "course"
    | "course-section"
    | "course-video"
    | "course-audio"
    | "course-document"
    | "course-image"
    | "old-question";
  model_id: number | string;
}

export interface CreateProductPayload {
  productable_type: string;
  productable_id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  allow_points?: boolean;
  points_price?: number | null;
  discount_price?: number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number | null;
  access_duration_days?: number | null;
  category?: string | null;
  is_featured?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string | null;
  price?: number | null;
  allow_points?: boolean;
  points_price?: number | null;
  discount_price?: number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number | null;
  access_duration_days?: number | null;
  category?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
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

export const ProductService = {
  async getProducts(
    params?: ProductListParams,
  ): Promise<PaginatedResponse<Product>> {
    const query = buildQueryString(params);
    const res = await apiClient.get<PaginatedResponse<Product>>(
      `/products${query}`,
    );
    return res.data;
  },

  async getById(productId: number | string): Promise<Product> {
    const res = await apiClient.get<Product>(`/products/${productId}`);
    return res.data;
  },

  async resolveByContent(params: ResolveProductParams): Promise<Product> {
    const query = buildQueryString(params);
    const res = await apiClient.get<Product>(`/products/resolve${query}`);
    console.log("Query:", query);
    return res.data;
  },

  async create(payload: CreateProductPayload): Promise<Product> {
    const res = await apiClient.post<Product>("/products", payload);
    return res.data;
  },

  async update(
    productId: number | string,
    payload: UpdateProductPayload,
  ): Promise<Product> {
    const res = await apiClient.put<Product>(`/products/${productId}`, payload);
    return res.data;
  },

  async deactivate(productId: number | string): Promise<{
    status?: string;
    message?: string;
  }> {
    const res = await apiClient.delete<{ status?: string; message?: string }>(
      `/products/${productId}`,
    );
    return res.data;
  },
};

export default ProductService;
