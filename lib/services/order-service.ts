import { apiClient } from "@/lib/api/api-client";

export type OrderPaymentMethod = "razorpay" | "points" | "mixed";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface RazorpayOrder {
  id: string;
  entity?: string;
  amount: number;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  receipt?: string | null;
  status?: string;
  attempts?: number;
  notes?: Record<string, string>;
  created_at?: number;
}

export interface AppOrder {
  id: number;
  user_id: string;
  product_id: number;
  payment_method: OrderPaymentMethod;
  amount: string | number;
  points_used: number;
  currency: string;
  status: OrderStatus;
  payment_gateway?: string | null;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  gateway_signature?: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  product?: {
    id: number;
    name?: string;
    title?: string;
    description?: string | null;
    category?: string | null;
  } | null;
  purchase?: {
    id: number;
    access_end?: string | null;
    status?: string;
  } | null;
}

export interface CreateOrderPayload {
  product_id: number;
  payment_method: OrderPaymentMethod;
  points?: number;
}

export interface CreateOrderResponse {
  order: AppOrder;
  razorpay_order: RazorpayOrder | null;
}

export interface VerifyPaymentPayload {
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message?: string;
  order: AppOrder;
  purchase: {
    id: number;
    user_id: string;
    product_id: number;
    order_id?: string | null;
    payment_id?: string | null;
    payment_method: string;
    amount_paid?: string | number | null;
    points_used?: number | null;
    access_start?: string | null;
    access_end?: string | null;
    device_increment?: number | null;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
}

export const OrderService = {
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const res = await apiClient.post<CreateOrderResponse>("/orders/create", payload);
    return res.data;
  },

  async verifyPayment(
    payload: VerifyPaymentPayload,
  ): Promise<VerifyPaymentResponse> {
    const res = await apiClient.post<VerifyPaymentResponse>(
      "/orders/verify-payment",
      payload,
    );
    return res.data;
  },

  async getMyOrders(): Promise<AppOrder[]> {
    const res = await apiClient.get<AppOrder[]>("/orders/my-orders");
    return res.data;
  },

  async getOrderById(orderId: number | string): Promise<AppOrder> {
    const res = await apiClient.get<AppOrder>(`/orders/${orderId}`);
    return res.data;
  },
};

export default OrderService;
