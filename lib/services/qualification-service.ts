// lib/services/qualification-service.ts

import { apiClient } from "@/lib/api/api-client";

/**
 * Qualification model based on Laravel backend
 */
export interface Qualification {
  id: number;
  name: string;
  description?: string | null;
  slug?: string;
  is_active: boolean;
  is_approved: boolean;
  is_custom?: boolean;
  user_id?: string | null; // Firebase UID for custom qualifications

  // Counts from withCount
  users_count?: number;
  courses_count?: number;
  quizzes_count?: number;
  jobs_count?: number;

  created_at: string;
  updated_at: string;
}

/**
 * Laravel pagination structure
 */
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

/**
 * Filters for list endpoints matching backend expectations
 */
export interface QualificationFilters {
  search?: string;
  type?: "custom" | "predefined" | "approved" | "pending";
  status?: "active" | "inactive";
  sort?: string; // e.g. "name" or "-created_at" or "name,-created_at"
  per_page?: number;
}

/**
 * Create qualification payload
 */
export interface CreateQualificationPayload {
  name: string;
  description?: string | null;
  user_id?: string; // Firebase UID for custom qualifications
  is_active?: boolean;
}

/**
 * Update qualification payload
 */
export interface UpdateQualificationPayload {
  name?: string;
  description?: string | null;
  is_approved?: boolean;
  is_active?: boolean;
}

/**
 * Bulk approve payload
 */
export interface BulkApprovePayload {
  qualification_ids: number[];
}

/**
 * Analytics overview response
 */
export interface QualificationAnalytics {
  total_qualifications: number;
  predefined_qualifications: number;
  custom_qualifications: number;
  pending_approval: number;
  active_qualifications: number;
  inactive_qualifications: number;
  recently_created: Qualification[];
  most_popular: Qualification[];
  growth_30_days: number;
}

class QualificationService {
  /**
   * 🔒 GET /qualifications
   * Get all qualifications with filtering (protected - requires auth)
   */
  async getAll(
    filters: QualificationFilters = {},
  ): Promise<PaginatedResponse<Qualification>> {
    try {
      const query = this.buildQueryString(filters);
      const response = await apiClient.get<PaginatedResponse<Qualification>>(
        `/qualifications${query}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      throw error;
    }
  }

  /**
   * 🌐 GET /qualifications/public
   * Get public qualifications (no auth required)
   * Returns only approved and active qualifications
   */
  async getPublic(filters: QualificationFilters = {}) {
    try {
      const query = this.buildQueryString(filters);
      const response = await apiClient.get<PaginatedResponse<Qualification>>(
        `/qualifications/public${query}`,
      );

      // Return the full paginated response
      return response.data;
    } catch (error) {
      console.error("Error fetching public qualifications:", error);
      throw error;
    }
  }

  /**
   * 🔒 GET /qualifications/{id}
   * Get single qualification by ID
   */
  async getById(id: number): Promise<Qualification> {
    try {
      const response = await apiClient.get<ApiResponse<Qualification>>(
        `/qualifications/${id}`,
      );

      if (response.data.status === "success" && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch qualification");
    } catch (error) {
      console.error(`Error fetching qualification ${id}:`, error);
      throw error;
    }
  }

  /**
   * 🔒 POST /qualifications
   * Create a new qualification (custom or predefined)
   */
  async create(payload: CreateQualificationPayload): Promise<Qualification> {
    try {
      const response = await apiClient.post<ApiResponse<Qualification>>(
        "/qualifications",
        payload,
      );

      if (response.data.status === "success" && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to create qualification",
      );
    } catch (error) {
      console.error("Error creating qualification:", error);
      throw error;
    }
  }

  /**
   * 🔒 PUT /qualifications/{id}
   * Update an existing qualification
   */
  async update(
    id: number,
    payload: UpdateQualificationPayload,
  ): Promise<Qualification> {
    try {
      const response = await apiClient.put<ApiResponse<Qualification>>(
        `/qualifications/${id}`,
        payload,
      );

      if (response.data.status === "success" && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to update qualification",
      );
    } catch (error) {
      console.error(`Error updating qualification ${id}:`, error);
      throw error;
    }
  }

  /**
   * 🔒 DELETE /qualifications/{id}
   * Delete a qualification
   */
  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/qualifications/${id}`,
      );

      if (response.data.status === "success") {
        return { message: response.data.message };
      }

      throw new Error(
        response.data.message || "Failed to delete qualification",
      );
    } catch (error) {
      console.error(`Error deleting qualification ${id}:`, error);
      throw error;
    }
  }

  /**
   * 🔒 POST /qualifications/bulk-approve
   * Bulk approve qualifications (admin only)
   */
  async bulkApprove(
    qualificationIds: number[],
  ): Promise<{ message: string; count: number }> {
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        "/qualifications/bulk-approve",
        { qualification_ids: qualificationIds },
      );

      if (response.data.status === "success") {
        // Extract count from message if needed
        const match = response.data.message.match(/(\d+)/);
        const count = match ? parseInt(match[0]) : qualificationIds.length;

        return {
          message: response.data.message,
          count,
        };
      }

      throw new Error(
        response.data.message || "Failed to bulk approve qualifications",
      );
    } catch (error) {
      console.error("Error bulk approving qualifications:", error);
      throw error;
    }
  }

  /**
   * 🔒 GET /qualifications/analytics/overview
   * Get qualification analytics (admin only)
   */
  async getAnalytics(): Promise<QualificationAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<QualificationAnalytics>>(
        "/qualifications/analytics/overview",
      );

      if (response.data.status === "success" && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch analytics");
    } catch (error) {
      console.error("Error fetching qualification analytics:", error);
      throw error;
    }
  }

  /**
   * 🔧 Helper: Check if qualification can be deleted
   * Useful for UI validation before calling delete
   */
  async canDelete(id: number): Promise<boolean> {
    try {
      const qualification = await this.getById(id);
      const hasRelations =
        (qualification.users_count ?? 0) > 0 ||
        (qualification.courses_count ?? 0) > 0 ||
        (qualification.quizzes_count ?? 0) > 0 ||
        (qualification.jobs_count ?? 0) > 0;

      return !hasRelations;
    } catch {
      return false;
    }
  }

  /**
   * 🔧 Helper: Build query string from filters
   * Matches backend expectations
   */
  private buildQueryString(filters: Record<string, any>): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * 🔧 Helper: Get qualification type based on properties
   */
  getQualificationType(
    qualification: Qualification,
  ): "custom" | "predefined" | "approved" | "pending" {
    if (qualification.user_id) {
      return "custom";
    }
    if (!qualification.user_id) {
      return "predefined";
    }
    if (qualification.is_approved) {
      return "approved";
    }
    return "pending";
  }

  /**
   * 🔧 Helper: Format qualification for display
   */
  formatQualification(qualification: Qualification): string {
    const parts = [qualification.name];

    if (qualification.is_custom) {
      parts.push("(Custom)");
    }

    if (!qualification.is_approved) {
      parts.push("(Pending)");
    }

    if (!qualification.is_active) {
      parts.push("(Inactive)");
    }

    return parts.join(" ");
  }
}

// Create singleton instance
export const qualificationService = new QualificationService();

// Also export as default for convenience
export default qualificationService;
