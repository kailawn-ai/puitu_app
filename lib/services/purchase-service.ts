import { apiClient } from "@/lib/api/api-client";

export type PurchasePaymentMethod =
  | "points"
  | "razorpay"
  | "mixed"
  | "admin_granted";

export interface PurchasePayload {
  product_id: number;
  payment_method: PurchasePaymentMethod;
  payment_id?: string | null;
  order_id?: string | null;
  amount?: number | null;
  points?: number | null;
}

export interface AdminGrantPurchasePayload {
  user_id: string;
  product_id: number;
}

export interface PurchasedProduct {
  id: number;
  productable_id?: number | null;
  productable_type?: string | null;
  name: string;
  description?: string | null;
  price?: string | number | null;
  allow_points?: boolean;
  points_price?: string | number | null;
  discount_price?: string | number | null;
  discount_start?: string | null;
  discount_end?: string | null;
  device_increment?: number | null;
  access_duration_days?: number | null;
  category?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  is_free_preview?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseResult {
  order_id: number;
  purchase_id: number;
  product_id: number;
  access_end?: string | null;
  device_increment?: number | null;
}

export interface UserPurchaseItem {
  id: number;
  user_id: string;
  product_id: number;
  payment_method: PurchasePaymentMethod;
  order_id?: number | null;
  payment_id?: string | null;
  amount_paid?: string | number | null;
  points_used?: number | null;
  access_start?: string | null;
  access_end?: string | null;
  device_increment?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  product?: PurchasedProduct | null;
}

export interface ProductAccessResponse {
  has_access: boolean;
  access_end?: string | null;
}

export const PurchaseService = {
  async purchase(payload: PurchasePayload): Promise<PurchaseResult> {
    const res = await apiClient.post<PurchaseResult>("/purchase", payload);
    return res.data;
  },

  async adminGrant(payload: AdminGrantPurchasePayload): Promise<PurchaseResult> {
    const res = await apiClient.post<PurchaseResult>(
      "/purchase/admin-grant",
      payload,
    );
    return res.data;
  },

  async getMyPurchases(): Promise<UserPurchaseItem[]> {
    const res = await apiClient.get<UserPurchaseItem[]>("/my-purchases");
    return res.data;
  },

  async checkAccess(productId: number | string): Promise<ProductAccessResponse> {
    const res = await apiClient.get<ProductAccessResponse>(
      `/purchase/check-access/${productId}`,
    );
    return res.data;
  },
};

export default PurchaseService;
